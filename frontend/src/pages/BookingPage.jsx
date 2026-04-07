import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

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

  const handleConfirm = (e) => {
    e.preventDefault();
    setStatusMessage('');

    if (!validateForm()) return;

    setStatusMessage('Your booking details look good. This is a UI demo only – integrate with your backend to finalize bookings.');
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
    <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-start justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-8">
        {/* Left: Main Form */}
        <div className="space-y-6">
          {/* Page Title */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
              Complete Your Booking
            </h1>
            <p className="text-gray-500 text-sm md:text-base">
              Secure your room in just a few steps.
            </p>
          </div>

          {/* Student Information Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Student Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="you@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. +94 77 000 0000"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Move-in Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Move-in Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Move-in Date</label>
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
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.moveInDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.moveInDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Move-out Date</label>
                <input
                  type="date"
                  value={moveOutDate}
                  min={moveInDate || todayISO}
                  onChange={(e) => {
                    setMoveOutDate(e.target.value);
                    setErrors((prev) => ({ ...prev, moveOutDate: undefined }));
                  }}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.moveOutDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.moveOutDate}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Duration</p>
                <p className="mt-1 text-sm text-gray-900">
                  {durationNights > 0 ? `${durationNights} night${durationNights > 1 ? 's' : ''}` : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes (optional)</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  placeholder="Anything the host should know about your stay"
                />
              </div>
            </div>
            {errors.dateRange && (
              <p className="mt-2 text-xs text-red-500">{errors.dateRange}</p>
            )}
          </div>

          {/* Calendar Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Availability</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Select your stay directly on the calendar. Unavailable dates are disabled.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 text-sm hover:bg-gray-50"
                >
                  
                  
                  &lt;
                </button>
                <span className="text-sm font-medium text-gray-800">
                  {monthFormatter.format(currentMonth)}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 text-sm hover:bg-gray-50"
                >
                  &gt;
                </button>
              </div>
            </div>

            <div className="mt-2 border border-gray-200 rounded-2xl p-4 bg-gray-50">
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

                      let baseClasses = 'flex h-9 w-9 items-center justify-center rounded-full text-xs font-medium transition-colors';

                      if (isDisabled) {
                        baseClasses += ' text-gray-300 bg-gray-100 line-through cursor-not-allowed';
                      } else if (isStart || isEnd) {
                        baseClasses += ' bg-blue-600 text-white cursor-pointer';
                      } else if (inRange) {
                        baseClasses += ' bg-blue-600/10 text-blue-700 cursor-pointer';
                      } else {
                        baseClasses += ' text-gray-700 hover:bg-blue-600/10 hover:text-blue-700 cursor-pointer';
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

              <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-gray-500">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-3 w-3 rounded-full bg-blue-600" />
                  <span>Selected start / end</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-3 w-3 rounded-full bg-blue-600/10 border border-blue-600/40" />
                  <span>Selected range</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-3 w-3 rounded-full bg-gray-200" />
                  <span>Unavailable</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              Confirm Booking
            </button>
          </div>

          {statusMessage && (
            <p className="text-xs text-green-600 mt-1">{statusMessage}</p>
          )}
        </div>

        {/* Right: Summary Card */}
        <aside className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-max space-y-4">
          <div className="overflow-hidden rounded-xl bg-gray-100 aspect-[4/3] flex items-center justify-center">
            <img
              src={room.imageUrl}
              alt={room.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-semibold text-gray-900">{room.title}</h2>
            <p className="text-sm text-gray-500">{room.location}</p>
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Move-in</span>
              <span className="text-gray-900 font-medium">{formattedMoveIn}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Move-out</span>
              <span className="text-gray-900 font-medium">{formattedMoveOut}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-gray-500">Duration</span>
              <span className="text-gray-900 font-medium">
                {durationNights > 0 ? `${durationNights} night${durationNights > 1 ? 's' : ''}` : '-'}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
