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

function addMonthsToISO(iso, months) {
  const base = parseISODate(iso);
  if (!base) return '';
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return getISODate(next);
}

// ── Step indicator ──────────────────────────────────────────────────
function StepBadge({ number, label, active, done }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
          ${done ? 'bg-[#22c55e] text-white' : active ? 'bg-[#3b4f86] text-white' : 'bg-[#232E45] text-gray-400'}`}
      >
        {done ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        ) : number}
      </div>
      <span className={`text-xs font-medium hidden sm:block ${active ? 'text-white' : done ? 'text-[#22c55e]' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

// ── Section card wrapper ────────────────────────────────────────────
function SectionCard({ icon, title, subtitle, children, accent }) {
  return (
    <div className={`rounded-2xl border bg-[#0B1628] p-6 space-y-5 ${accent ? 'border-[#3b4f86]' : 'border-[#232E45]'}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#232E45] text-[#6b84c9]">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-white leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Labelled input ──────────────────────────────────────────────────
function Field({ label, error, hint, required, children }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-gray-500">{hint}</p>}
      {error && <p className="text-[11px] text-red-400 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>}
    </div>
  );
}

const inputCls =
  'mt-0.5 w-full rounded-xl border border-[#232E45] bg-[#060F1E] px-3 py-2.5 text-sm text-gray-100 placeholder-gray-600 shadow-sm transition-colors focus:border-[#3b4f86] focus:outline-none focus:ring-1 focus:ring-[#3b4f86] hover:border-[#2e3c5e]';

const dateInputCls =
  'mt-0.5 w-full rounded-xl border border-[#3b4f86] bg-[#0B1628] px-3 py-2.5 text-sm text-gray-100 shadow-sm transition-colors focus:border-white focus:outline-none focus:ring-1 focus:ring-white hover:border-[#5a6fa8]';

// ── Main component ──────────────────────────────────────────────────
export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const room = location.state?.room || {
    annexId: null,
    title: 'Room 402 — Premium Single',
    imageUrl:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&q=80&auto=format&fit=crop',
    location: 'AnnexRent · Near SLIIT Malabe Campus',
    pricePerMonth: 18500,
  };

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [moveOutDate, setMoveOutDate] = useState('');
  const [stayPreset, setStayPreset] = useState('custom');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const unavailableDates = useMemo(
    () => ['2026-04-10', '2026-04-11', '2026-04-18', '2026-04-19', '2026-05-01'],
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
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startWeekday = firstDay.getDay();
    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
    return weeks;
  }, [currentMonth]);

  const isDateUnavailable = (iso) => unavailableDates.includes(iso);
  const isDateInRange = (iso) => moveInDate && moveOutDate && iso > moveInDate && iso < moveOutDate;
  const isSelectedStart = (iso) => !!moveInDate && iso === moveInDate;
  const isSelectedEnd = (iso) => !!moveOutDate && iso === moveOutDate;

  const handleFullNameChange = (e) => {
    setFullName(e.target.value.replace(/[^A-Za-z\s]/g, ''));
    setErrors((p) => ({ ...p, fullName: undefined }));
  };

  const handlePhoneChange = (e) => {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
    setErrors((p) => ({ ...p, phone: undefined }));
  };

  const handleDayClick = (date) => {
    if (!date) return;
    const iso = getISODate(date);
    if (iso < todayISO || isDateUnavailable(iso)) return;

    if (!moveInDate || (moveInDate && moveOutDate)) {
      setMoveInDate(iso);
      setMoveOutDate('');
      setErrors((p) => ({ ...p, moveInDate: undefined, moveOutDate: undefined }));
      return;
    }
    if (iso <= moveInDate) {
      setMoveInDate(iso);
      setMoveOutDate('');
      setErrors((p) => ({ ...p, moveInDate: undefined, moveOutDate: undefined }));
      return;
    }
    setMoveOutDate(iso);
    setErrors((p) => ({ ...p, moveOutDate: undefined }));
  };

  const handlePrevMonth = () =>
    setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setCurrentMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1));

  const handleClearDates = () => {
    setMoveInDate('');
    setMoveOutDate('');
    setStayPreset('custom');
    setErrors((p) => ({ ...p, moveInDate: undefined, moveOutDate: undefined, dateRange: undefined }));
  };

  const handlePresetChange = (value) => {
    setStayPreset(value);
    if (!moveInDate) return;
    if (value === 'semester') {
      const out = addMonthsToISO(moveInDate, 6);
      if (out) { setMoveOutDate(out); setErrors((p) => ({ ...p, moveOutDate: undefined, dateRange: undefined })); }
    } else if (value === 'year') {
      const out = addMonthsToISO(moveInDate, 12);
      if (out) { setMoveOutDate(out); setErrors((p) => ({ ...p, moveOutDate: undefined, dateRange: undefined })); }
    }
  };

  const validateForm = () => {
    const e = {};
    if (!fullName.trim()) e.fullName = 'Full name is required.';
    else if (!/^[A-Za-z\s]+$/.test(fullName.trim())) e.fullName = 'Full name must contain only letters.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^\d{10}$/.test(phone)) e.phone = 'Phone must be exactly 10 digits.';
    if (!moveInDate) e.moveInDate = 'Move-in date is required.';
    if (!moveOutDate) e.moveOutDate = 'Move-out date is required.';
    if (moveInDate && moveOutDate && moveOutDate <= moveInDate) e.moveOutDate = 'Move-out must be after move-in.';
    if (moveInDate && moveOutDate) {
      const hasBlocked = unavailableDates.some((d) => d >= moveInDate && d <= moveOutDate);
      if (hasBlocked) e.dateRange = 'Your selection includes unavailable dates. Please adjust.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setStatusMessage('');
    if (!validateForm()) return;
    if (!room.annexId) {
      setStatusMessage('Unable to send booking request: missing annex information.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = { propertyId: room.annexId, checkInDate: moveInDate, checkOutDate: moveOutDate, notes };
      const response = await api.post('/bookings', payload);
      if (response.data?.success) {
        setStatusMessage('Booking request sent! The owner will review and respond shortly. Check your profile for status updates.');
        setRequestSubmitted(true);
        setFullName(''); setEmail(''); setPhone(''); setMoveInDate(''); setMoveOutDate(''); setNotes(''); setErrors({});
      } else {
        setStatusMessage(response.data?.message || 'Failed to send booking request.');
      }
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Server error while sending booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => navigate(-1);

  const monthFormatter = useMemo(() => new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }), []);

  const formattedMoveIn = moveInDate ? parseISODate(moveInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const formattedMoveOut = moveOutDate ? parseISODate(moveOutDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  // Step completion
  const step1Done = fullName.trim() && email.trim() && phone.trim();
  const step2Done = moveInDate && moveOutDate;

  return (
    <div className="min-h-screen bg-[#060F1E] px-4 py-8 md:py-12 flex items-start justify-center text-gray-100">
      <div className="w-full max-w-6xl space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#6b84c9] mb-1">AnnexRent</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-white">Complete Your Booking</h1>
            <p className="text-sm text-gray-400 mt-1">Fill in the details below to send a booking request.</p>
          </div>
          {/* Progress steps */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <StepBadge number="1" label="Your info" active={!step1Done} done={!!step1Done} />
            <div className="h-px w-6 bg-[#232E45]" />
            <StepBadge number="2" label="Stay dates" active={!!step1Done && !step2Done} done={!!step2Done} />
            <div className="h-px w-6 bg-[#232E45]" />
            <StepBadge number="3" label="Confirm" active={!!step1Done && !!step2Done} done={requestSubmitted} />
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

          {/* ── LEFT column ── */}
          <div className="space-y-5">

            {/* Student info */}
            <SectionCard
              accent
              title="Your Information"
              subtitle="Used to identify your booking request."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            >
              <div className="space-y-4">
                <Field label="Full Name" required error={errors.fullName}>
                  <input
                    type="text"
                    value={fullName}
                    onChange={handleFullNameChange}
                    className={inputCls}
                    placeholder="e.g. Kasun Perera"
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Email Address" required error={errors.email}>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                      className={inputCls}
                      placeholder="you@example.com"
                    />
                  </Field>
                  <Field label="Phone Number" required error={errors.phone} hint="10-digit Sri Lankan mobile number">
                    <input
                      type="tel"
                      value={phone}
                      onChange={handlePhoneChange}
                      inputMode="numeric"
                      maxLength={10}
                      className={inputCls}
                      placeholder="07XXXXXXXX"
                    />
                  </Field>
                </div>
              </div>
            </SectionCard>

            {/* Move-in details */}
            <SectionCard
              title="Move-in Details"
              subtitle="Set your preferred stay period."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              }
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Move-in Date" required error={errors.moveInDate}>
                    <input
                      type="date"
                      value={moveInDate}
                      min={todayISO}
                      onChange={(e) => {
                        setMoveInDate(e.target.value);
                        if (moveOutDate && e.target.value && moveOutDate <= e.target.value) setMoveOutDate('');
                        setErrors((p) => ({ ...p, moveInDate: undefined }));
                      }}
                      className={dateInputCls}
                    />
                  </Field>
                  <Field label="Move-out Date" required error={errors.moveOutDate}>
                    <input
                      type="date"
                      value={moveOutDate}
                      min={moveInDate || todayISO}
                      onChange={(e) => { setMoveOutDate(e.target.value); setErrors((p) => ({ ...p, moveOutDate: undefined })); }}
                      className={dateInputCls}
                    />
                  </Field>
                </div>

                {/* Duration pill */}
                {durationNights > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1a2540] border border-[#3b4f86] px-3 py-1 text-xs font-medium text-[#a5b8e8]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" />
                        <path d="M10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                      </svg>
                      {durationNights} {durationNights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {moveInDate && moveOutDate
                        ? `${parseISODate(moveInDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} → ${parseISODate(moveOutDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : ''}
                    </span>
                  </div>
                )}

                {/* Stay preset */}
                <Field label="Quick duration preset" hint="Select a move-in date first, then choose a preset to auto-fill the move-out date.">
                  <div className="flex flex-wrap gap-2 mt-1">
                    {[
                      { value: 'custom', label: 'Custom' },
                      { value: 'semester', label: '6 months (semester)' },
                      { value: 'year', label: '12 months (full year)' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handlePresetChange(opt.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
                          ${stayPreset === opt.value
                            ? 'border-[#3b4f86] bg-[#3b4f86] text-white'
                            : 'border-[#232E45] bg-transparent text-gray-400 hover:border-[#3b4f86] hover:text-gray-200'}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                {/* Notes */}
                <Field label="Notes for host" hint="Optional — mention any preferences, allergies, or requirements.">
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder="e.g. I'll be arriving late in the evening on the first day."
                  />
                </Field>

                {errors.dateRange && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.dateRange}
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Availability calendar */}
            <SectionCard
              title="Availability Calendar"
              subtitle="Click a start date, then an end date to set your stay."
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                </svg>
              }
            >
              {/* Calendar nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#232E45] bg-[#060F1E] text-gray-300 hover:bg-[#232E45] hover:text-white transition-colors text-sm"
                >
                  ‹
                </button>
                <span className="text-sm font-semibold text-white">{monthFormatter.format(currentMonth)}</span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#232E45] bg-[#060F1E] text-gray-300 hover:bg-[#232E45] hover:text-white transition-colors text-sm"
                >
                  ›
                </button>
              </div>

              {/* Calendar grid */}
              <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
                <div className="grid grid-cols-7 text-center mb-2">
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                    <div key={d} className="text-[11px] font-semibold text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                <div className="space-y-0.5">
                  {calendarWeeks.map((week, i) => (
                    <div key={i} className="grid grid-cols-7">
                      {week.map((date, idx) => {
                        if (!date) return <div key={idx} className="h-9" />;
                        const iso = getISODate(date);
                        const isPast = iso < todayISO;
                        const blocked = isDateUnavailable(iso);
                        const inRange = isDateInRange(iso);
                        const isStart = isSelectedStart(iso);
                        const isEnd = isSelectedEnd(iso);
                        const isDisabled = isPast || blocked;
                        const isToday = iso === todayISO;

                        let cls =
                          'relative flex h-9 w-full items-center justify-center text-xs font-medium transition-all select-none';

                        if (inRange) {
                          cls += ' bg-[#dcfce7] text-[#166534]';
                        }

                        let innerCls =
                          'relative z-10 flex h-8 w-8 items-center justify-center rounded-full';

                        if (isDisabled) {
                          innerCls += ' text-gray-300 cursor-not-allowed';
                          if (blocked) innerCls += ' line-through text-red-300';
                        } else if (isStart || isEnd) {
                          innerCls += ' bg-[#22c55e] text-white shadow-sm cursor-pointer font-semibold';
                        } else {
                          innerCls +=
                            ' cursor-pointer text-gray-700 hover:bg-[#d1fae5] hover:text-[#166534]';
                          if (isToday) innerCls += ' ring-1 ring-[#3b4f86] font-semibold text-[#3b4f86]';
                        }

                        return (
                          <div
                            key={iso}
                            className={cls + (isStart ? ' rounded-l-full' : '') + (isEnd ? ' rounded-r-full' : '')}
                          >
                            <button
                              type="button"
                              onClick={() => handleDayClick(date)}
                              disabled={isDisabled}
                              className={innerCls}
                            >
                              {date.getDate()}
                              {blocked && (
                                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend + clear */}
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-gray-100 pt-3">
                  <LegendItem color="bg-[#22c55e] border-[#16a34a]" label="Selected" />
                  <LegendItem color="bg-[#dcfce7] border-[#22c55e]" label="Stay range" />
                  <LegendItem color="bg-white border-[#3b4f86] ring-1 ring-[#3b4f86]" label="Today" />
                  <LegendItem dotColor="bg-red-400" label="Unavailable" />
                  <button
                    type="button"
                    onClick={handleClearDates}
                    className="ml-auto text-[11px] font-medium text-gray-400 hover:text-gray-700 underline underline-offset-2"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            </SectionCard>

            {/* Status message */}
            {statusMessage && (
              <div
                className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-sm ${
                  requestSubmitted
                    ? 'bg-green-500/10 border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="mt-0.5 h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  {requestSubmitted
                    ? <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    : <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  }
                </svg>
                {statusMessage}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center justify-center rounded-xl border border-[#232E45] bg-transparent px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-[#232E45]/40 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3b4f86] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#4c62a3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending Request…
                  </>
                ) : (
                  <>
                    Send Booking Request
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── RIGHT column — booking summary ── */}
          <aside className="space-y-4 sticky top-6">
            {/* Room card */}
            <div className="overflow-hidden rounded-2xl border border-[#232E45] bg-[#0B1628]">
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img
                  src={room.imageUrl}
                  alt={room.title}
                  className="h-full w-full object-cover transition-transform hover:scale-105 duration-300"
                />
              </div>
              <div className="p-5 space-y-1">
                <h2 className="text-sm font-semibold text-white leading-tight">{room.title}</h2>
                <p className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-[#6b84c9]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {room.location}
                </p>
              </div>
            </div>

            {/* Booking summary */}
            <div className="rounded-2xl border border-[#232E45] bg-[#0B1628] p-5 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400">Booking Summary</h3>

              <div className="space-y-2.5">
                <SummaryRow label="Move-in" value={formattedMoveIn} highlight={!!moveInDate} />
                <SummaryRow label="Move-out" value={formattedMoveOut} highlight={!!moveOutDate} />
                <div className="border-t border-[#232E45] pt-2.5">
                  <SummaryRow
                    label="Duration"
                    value={durationNights > 0 ? `${durationNights} night${durationNights > 1 ? 's' : ''}` : '—'}
                    highlight={durationNights > 0}
                    bold
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2 border-t border-[#232E45] pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Requirements</p>
                <CheckItem done={!!step1Done} label="Student information" />
                <CheckItem done={!!moveInDate} label="Move-in date selected" />
                <CheckItem done={!!moveOutDate} label="Move-out date selected" />
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed border-t border-[#232E45] pt-4">
                This is a booking <span className="text-gray-300 font-medium">request</span>. The property owner will review and respond within 24–48 hours.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ───────────────────────────────────────────────────
function LegendItem({ color, dotColor, label }) {
  return (
    <div className="flex items-center gap-1.5">
      {dotColor ? (
        <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
      ) : (
        <span className={`inline-block h-3 w-3 rounded-full border ${color}`} />
      )}
      <span className="text-[11px] text-gray-500">{label}</span>
    </div>
  );
}

function SummaryRow({ label, value, highlight, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-xs ${bold ? 'font-semibold' : 'font-medium'} ${highlight ? 'text-white' : 'text-gray-600'}`}>
        {value}
      </span>
    </div>
  );
}

function CheckItem({ done, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${done ? 'border-[#22c55e] bg-[#22c55e]' : 'border-[#232E45] bg-transparent'}`}>
        {done && (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
      <span className={`text-xs ${done ? 'text-gray-300' : 'text-gray-500'}`}>{label}</span>
    </div>
  );
}