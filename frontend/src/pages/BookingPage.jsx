import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

function getISODate(date) {
  return date.toISOString().slice(0, 10);
}

function parseISODate(value) {
  return value ? new Date(value + 'T00:00:00') : null;
}

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = (parseISODate(end) - parseISODate(start)) / oneDay;
  return diff > 0 ? diff : 0;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const room = location.state?.room || {
    annexId: null,
    title: 'Room 402 - Premium Single',
    imageUrl:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&q=80&auto=format&fit=crop',
    location: 'AnnexRent · Near SLIIT Malabe Campus',
  };

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Example of already booked/unavailable dates (YYYY-MM-DD)
  const unavailableDates = useMemo(
    () => [
      '2026-04-10',
      '2026-04-11',
      '2026-04-18',
      '2026-04-19',
      '2026-05-01',
    ],
    []
  );

  const todayISO = useMemo(() => getISODate(new Date()), []);

  const durationNights = useMemo(
    () => daysBetween(moveInDate, moveOutDate),
    [moveInDate, moveOutDate]
  );

  const calendarWeeks = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startWeekday = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(new Date(year, month, day));
    }

    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, 7 + i));
    }

    return weeks;
  }, [currentMonth]);

  const isDateUnavailable = (iso) => unavailableDates.includes(iso);

  const isDateInRange = (iso) => {
    if (!moveInDate || !moveOutDate) return false;
    return iso >= moveInDate && iso <= moveOutDate;
  };

  const isSelectedStart = (iso) => !!moveInDate && iso === moveInDate;
  const isSelectedEnd = (iso) => !!moveOutDate && iso === moveOutDate;

  const handleDayClick = (date) => {
    if (!date) return;
    const iso = getISODate(date);

    if (iso < todayISO) return;
    if (isDateUnavailable(iso)) return;

    if (!moveInDate || (moveInDate && moveOutDate)) {
      setMoveInDate(iso);
      setMoveOutDate('');
      setErrors((prev) => ({ ...prev, moveInDate: undefined, moveOutDate: undefined }));
      return;
    }

    if (iso <= moveInDate) {
      setMoveInDate(iso);
      setMoveOutDate('');
      setErrors((prev) => ({ ...prev, moveInDate: undefined, moveOutDate: undefined }));
      return;
    }

    setMoveOutDate(iso);
    setErrors((prev) => ({ ...prev, moveOutDate: undefined }));
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = 'Full name is required.';

    if (!email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email.';

    if (!phone.trim()) newErrors.phone = 'Phone number is required.';

    if (!moveInDate) newErrors.moveInDate = 'Move-in date is required.';
    if (!moveOutDate) newErrors.moveOutDate = 'Move-out date is required.';

    if (moveInDate && moveOutDate && moveOutDate <= moveInDate) {
      newErrors.moveOutDate = 'Move-out must be after move-in.';
    }

    if (moveInDate && moveOutDate) {
      // Ensure no unavailable date falls inside the selected range
      const hasBlocked = unavailableDates.some((d) => d >= moveInDate && d <= moveOutDate);
      if (hasBlocked) {
        newErrors.dateRange = 'Selected dates include unavailable days. Please adjust your stay.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!validateForm()) return;
    if (!room.annexId) {
      setStatusMessage('Unable to create booking: missing annex information.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        propertyId: room.annexId,
        checkInDate: moveInDate,
        checkOutDate: moveOutDate,
        notes,
      };

      const response = await api.post('/bookings', payload);

      if (response.data?.success) {
        setStatusMessage('Booking created successfully. You can view it in your account and review after completion.');
      } else {
        setStatusMessage(response.data?.message || 'Failed to create booking.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Server error while creating booking.';
      setStatusMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }),
    []
  );

  const formattedMoveIn = moveInDate ? parseISODate(moveInDate).toLocaleDateString() : '-';
  const formattedMoveOut = moveOutDate ? parseISODate(moveOutDate).toLocaleDateString() : '-';

  return (
    <div className="min-h-screen bg-[#060F1E] px-4 py-10 flex items-start justify-center text-gray-100">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-white">
              Complete Your Booking
            </h1>
            <p className="text-sm md:text-base text-gray-300">
              Secure your room in just a few steps.
            </p>
          </div>

          <div className="bg-[#0B1628] rounded-2xl shadow-sm border border-[#3b4f86] p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Student Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-[#3b4f86] focus:outline-none focus:ring-1 focus:ring-[#3b4f86]"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-400">{errors.fullName}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-[#3b4f86] focus:outline-none focus:ring-1 focus:ring-[#3b4f86]"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-[#3b4f86] focus:outline-none focus:ring-1 focus:ring-[#3b4f86]"
                    placeholder="e.g. +94 77 000 0000"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-400">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0B1628] rounded-2xl shadow-sm border border-[#232E45] p-6 space-y-4">
            <h2 className="text-base font-semibold text-white">Move-in Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200">Move-in Date</label>
                <input
                  type="date"
                  value={moveInDate}
                  min={todayISO}
                  onChange={(e) => {
                    setMoveInDate(e.target.value);
                    if (moveOutDate && e.target.value && moveOutDate <= e.target.value) {
                      setMoveOutDate('');
                    }
                    setErrors((prev) => ({ ...prev, moveInDate: undefined }));
                  }}
                  className="mt-1 w-full rounded-xl border border-[#3b4f86] bg-[#0B1628] px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
                {errors.moveInDate && (
                  <p className="mt-1 text-xs text-red-400">{errors.moveInDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">Move-out Date</label>
                <input
                  type="date"
                  value={moveOutDate}
                  min={moveInDate || todayISO}
                  onChange={(e) => {
                    setMoveOutDate(e.target.value);
                    setErrors((prev) => ({ ...prev, moveOutDate: undefined }));
                  }}
                  className="mt-1 w-full rounded-xl border border-[#3b4f86] bg-[#0B1628] px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
                />
                {errors.moveOutDate && (
                  <p className="mt-1 text-xs text-red-400">{errors.moveOutDate}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-200">Duration</p>
                <p className="mt-1 text-sm text-gray-100">
                  {durationNights > 0 ? `${durationNights} night${durationNights > 1 ? 's' : ''}` : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200">Notes (optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#232E45] bg-[#0B1628] px-3 py-2 text-sm text-gray-100 shadow-sm focus:border-[#3b4f86] focus:outline-none focus:ring-1 focus:ring-[#3b4f86] resize-none"
                  placeholder="Anything the host should know about your stay"
                />
              </div>
            </div>
            {errors.dateRange && (
              <p className="mt-2 text-xs text-red-400">{errors.dateRange}</p>
            )}
          </div>

          <div className="bg-[#0B1628] rounded-2xl shadow-sm border border-[#232E45] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Availability</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Select your stay directly on the calendar. Unavailable dates are disabled.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#232E45] text-white text-sm hover:bg-white hover:text-[#232E45]"
                >
                  
                  
                  &lt;
                </button>
                <span className="text-sm font-medium text-gray-100">
                  {monthFormatter.format(currentMonth)}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#232E45] text-white text-sm hover:bg-white hover:text-[#232E45]"
                >
                  &gt;
                </button>
              </div>
            </div>

            <div className="mt-2 border border-[#e5e7eb] rounded-2xl p-4 bg-white">
              <div className="grid grid-cols-7 text-center text-[11px] font-medium text-gray-500 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="space-y-1">
                {calendarWeeks.map((week, i) => (
                  <div key={i} className="grid grid-cols-7 gap-1 text-center">
                    {week.map((date, idx) => {
                      if (!date) {
                        return <div key={idx} className="h-9" />;
                      }

                      const iso = getISODate(date);
                      const isPast = iso < todayISO;
                      const blocked = isDateUnavailable(iso);
                      const inRange = isDateInRange(iso);
                      const isStart = isSelectedStart(iso);
                      const isEnd = isSelectedEnd(iso);

                      const isDisabled = isPast || blocked;

                      let baseClasses = 'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors border';

                      if (isDisabled) {
                        // Blocked / past dates: slightly darker than background with a strong red border
                        baseClasses += ' text-gray-400 bg-gray-200 border-[#f97373] line-through cursor-not-allowed';
                      } else if (isStart || isEnd) {
                        // Selected start / end: solid green similar to the reference calendar
                        baseClasses += ' bg-[#22c55e] text-white border-[#16a34a] shadow-sm cursor-pointer';
                      } else if (inRange) {
                        // Selected range: soft green background
                        baseClasses += ' bg-[#bbf7d0] text-[#166534] border-[#22c55e] cursor-pointer';
                      } else {
                        baseClasses += ' text-gray-700 border-transparent hover:border-[#3b4f86] hover:bg-[#e5f0ff] hover:text-[#060F1E] cursor-pointer';
                      }

                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => handleDayClick(date)}
                          className={baseClasses}
                        >
                          {date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-3 w-3 rounded-full bg-[#22c55e] border border-[#16a34a]" />
                  <span>Available (selected)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-3 w-3 rounded-full bg-[#bbf7d0] border border-[#22c55e]" />
                  <span>Stay range</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-3 w-3 rounded-full bg-[#f97373] border border-[#f97373]" />
                  <span>Blocked / unavailable</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center rounded-xl border border-[#232E45] bg-transparent px-4 py-2.5 text-sm font-medium text-gray-200 shadow-sm hover:bg-[#232E45]/30"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-[#232E45] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#3b4f86] disabled:opacity-60"
            >
              {submitting ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs text-green-400 mt-1">{statusMessage}</p>
          )}
        </div>

        <aside className="bg-[#0B1628] rounded-2xl shadow-sm border border-[#232E45] p-6 h-max space-y-4">
          <div className="overflow-hidden rounded-xl bg-[#060F1E] aspect-[4/3] flex items-center justify-center">
            <img
              src={room.imageUrl}
              alt={room.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-semibold text-white">{room.title}</h2>
            <p className="text-sm text-gray-300">{room.location}</p>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Move-in</span>
              <span className="text-gray-100 font-medium">{formattedMoveIn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Move-out</span>
              <span className="text-gray-100 font-medium">{formattedMoveOut}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#232E45]">
              <span className="text-gray-300">Duration</span>
              <span className="text-gray-100 font-medium">
                {durationNights > 0 ? `${durationNights} night${durationNights > 1 ? 's' : ''}` : '-'}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
