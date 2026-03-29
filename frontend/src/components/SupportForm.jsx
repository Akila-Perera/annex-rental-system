import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SupportForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '', description: '',
  });
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [focusedField, setFocusedField] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/support', formData);
      navigate('/details');
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  /* Dynamic input classes — blue ring on focus */
  const inputCls = (name) =>
    `w-full px-3.5 py-2.5 bg-white/4 rounded-lg text-[#f0f4ff] text-[0.95rem] outline-none font-[DM_Sans,sans-serif] transition-all duration-300 ${
      focusedField === name
        ? 'border-[1.5px] border-blue-500/60 shadow-[0_0_0_3px_rgba(45,126,247,0.15)]'
        : 'border-[1.5px] border-white/7'
    }`;

  return (
    <div className="min-h-screen bg-[#0d1117] flex justify-center items-center px-4 py-8 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .font-display { font-family: 'Syne', sans-serif; }
        body { font-family: 'DM Sans', sans-serif; }
        @keyframes pulseGlow { 0%,100%{opacity:.4;transform:scale(1);} 50%{opacity:.7;transform:scale(1.08);} }
        .animate-pulse-glow { animation: pulseGlow 5s ease-in-out infinite; }
        .glow-orb { background: radial-gradient(circle, rgba(45,126,247,0.15) 0%, transparent 70%); }
      `}</style>

      {/* Background glow */}
      <div className="fixed -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full glow-orb animate-pulse-glow pointer-events-none z-0" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[620px] bg-[#1a2030] border border-white/7 rounded-[20px] px-11 py-12 shadow-[0_20px_60px_rgba(0,0,0,0.4),0_0_0_1px_rgba(45,126,247,0.08)]">

        {/* Badge */}
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-[0.82rem] font-medium tracking-[0.02em]">
          🎧 Student Support
        </div>

        <h2 className="font-display text-[1.9rem] font-extrabold text-[#f0f4ff] mb-2 leading-[1.2]">How Can We Help You?</h2>
        <p className="text-[#8a96b0] mb-8 text-[0.95rem] leading-[1.6]">Fill in the details below and our team will get back to you shortly.</p>

        {error && (
          <div className="bg-red-500/12 border border-red-500/30 text-red-400 px-3.5 py-2.5 rounded-lg mb-5 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* First + Last name row */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            {[['firstName','FIRST NAME','Enter first name','text'],['lastName','LAST NAME','Enter last name','text']].map(([name,label,placeholder,type])=>(
              <div key={name}>
                <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">{label}</label>
                <input type={type} name={name} value={formData[name]} onChange={handleChange}
                  onFocus={()=>setFocusedField(name)} onBlur={()=>setFocusedField('')}
                  placeholder={placeholder} required className={inputCls(name)} />
              </div>
            ))}
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">EMAIL ADDRESS</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange}
              onFocus={()=>setFocusedField('email')} onBlur={()=>setFocusedField('')}
              placeholder="example@gmail.com" required className={inputCls('email')} />
          </div>

          {/* Phone */}
          <div className="mb-5">
            <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">PHONE NUMBER</label>
            <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange}
              onFocus={()=>setFocusedField('phoneNumber')} onBlur={()=>setFocusedField('')}
              placeholder="+94 77 123 4567" required className={inputCls('phoneNumber')} />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="block text-[0.7rem] font-semibold text-[#5a6478] tracking-[0.08em] mb-1.5">DESCRIPTION</label>
            <textarea name="description" value={formData.description} onChange={handleChange}
              onFocus={()=>setFocusedField('description')} onBlur={()=>setFocusedField('')}
              placeholder="Describe your issue or support request..." required rows={5}
              className={`${inputCls('description')} resize-y leading-[1.6]`} />
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className={`w-full py-3.5 rounded-[14px] text-[0.97rem] font-semibold mt-2 transition-all duration-300 cursor-pointer ${
              loading
                ? 'bg-blue-500/35 text-white/50 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-400 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/35'
            }`}>
            {loading ? 'Submitting...' : '🎧 Submit Support Request'}
          </button>
        </form>

        <p className="text-center mt-6">
          <a href="/" className="text-[#5a6478] text-sm hover:text-blue-300 transition-colors duration-200">← Back to Home</a>
        </p>
      </div>
    </div>
  );
}

export default SupportForm;