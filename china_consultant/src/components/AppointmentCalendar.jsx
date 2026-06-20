import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { COMPANY } from '../data/siteData';
import { dbAddAppointment, dbGetAppointments } from '../utils/db';

const TIME_SLOTS = [
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM'
];

const VISA_TYPES = {
  China: ['Tourist (L)', 'Business (M)', 'Student (X)', 'Family (Q)', 'Transit (G)'],
  Japan: ['Tourist', 'Business', 'Student', 'Transit'],
  'South Korea': ['Tourist', 'Business', 'Student', 'Working Holiday']
};

export default function AppointmentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    phone: '',
    country: 'China',
    visaType: 'Tourist (L)',
    notes: ''
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  // Load booked appointments
  useEffect(() => {
    const loadAppointments = async () => {
      const appointments = await dbGetAppointments();
      setBookedSlots(appointments);
    };
    loadAppointments();
  }, []);

  // Calendar navigation
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const isWeekend = (day) => {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 6; // Saturday closed (Sunday = 0, open)
  };

  const isPastDate = (day) => {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSlotBooked = (day, time) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookedSlots.some(slot => slot.date === dateStr && slot.time === time);
  };

  const handleDateSelect = (day) => {
    if (isPastDate(day) || isWeekend(day)) return;
    
    const date = new Date(year, month, day);
    setSelectedDate(date);
    setSelectedTime(null);
    setShowForm(false);
  };

  const handleTimeSelect = (time) => {
    if (isSlotBooked(selectedDate.getDate(), time)) return;
    setSelectedTime(time);
    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset visa type when country changes
      ...(name === 'country' && { visaType: VISA_TYPES[value]?.[0] || '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    const appointment = {
      ...formData,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      clientName: formData.clientName,
    };

    try {
      await dbAddAppointment(appointment);
      setSubmitStatus('success');
      
      // Refresh booked slots
      const appointments = await dbGetAppointments();
      setBookedSlots(appointments);

      // Reset form after delay
      setTimeout(() => {
        setShowForm(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setFormData({
          clientName: '',
          email: '',
          phone: '',
          country: 'China',
          visaType: 'Tourist (L)',
          notes: ''
        });
        setSubmitStatus(null);
      }, 2500);
    } catch (error) {
      console.error('Booking error:', error);
      setSubmitStatus('error');
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Day headers
    const headers = dayNames.map(day => (
      <div key={day} className="calendar__day-header">{day}</div>
    ));

    // Empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar__day calendar__day--empty"></div>);
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const isPast = isPastDate(day);
      const isWeekendDay = isWeekend(day);
      const isDisabled = isPast || isWeekendDay;
      const isSelected = selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month &&
        selectedDate.getFullYear() === year;

      days.push(
        <button
          key={day}
          className={`calendar__day ${isDisabled ? 'calendar__day--disabled' : ''} ${isSelected ? 'calendar__day--selected' : ''}`}
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    return (
      <>
        <div className="calendar__headers">{headers}</div>
        <div className="calendar__grid">{days}</div>
      </>
    );
  };

  const availableSlots = TIME_SLOTS.filter(time => 
    selectedDate && !isSlotBooked(selectedDate.getDate(), time)
  );

  return (
    <section id="appointment" className="section section--alt" aria-labelledby="appointment-title">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          <div className="section__header">
            <span className="section__label">Schedule</span>
            <h2 id="appointment-title" className="section__title">Book an Appointment</h2>
            <p className="section__subtitle">
              Schedule a consultation with our visa experts. Select your preferred date and time.
            </p>
            <div className="gold-line"></div>
          </div>
        </motion.div>

        <div className="appointment-wrapper">
          {/* Calendar Section */}
          <motion.div 
            className="calendar-card"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="calendar__header">
              <button className="calendar__nav-btn" onClick={prevMonth} aria-label="Previous month">
                ‹
              </button>
              <h3 className="calendar__month">{monthName} {year}</h3>
              <button className="calendar__nav-btn" onClick={nextMonth} aria-label="Next month">
                ›
              </button>
            </div>

            {renderCalendarDays()}

            <div className="calendar__legend">
              <div className="calendar__legend-item">
                <span className="calendar__legend-dot calendar__legend-dot--available"></span>
                Available
              </div>
              <div className="calendar__legend-item">
                <span className="calendar__legend-dot calendar__legend-dot--selected"></span>
                Selected
              </div>
              <div className="calendar__legend-item">
                <span className="calendar__legend-dot calendar__legend-dot--closed"></span>
                Closed (Saturday)
              </div>
            </div>
          </motion.div>

          {/* Time Slots & Form Section */}
          <motion.div 
            className="booking-panel"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <AnimatePresence mode="wait">
              {!selectedDate ? (
                <motion.div 
                  key="select-date"
                  className="booking-placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="booking-placeholder__icon">📅</div>
                  <h3>Select a Date</h3>
                  <p>Choose your preferred appointment date from the calendar to see available time slots.</p>
                  <div className="booking-placeholder__info">
                    <p><strong>Office Hours:</strong></p>
                    <p>{COMPANY.officeHours}</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                      Saturday closed
                    </p>
                  </div>
                </motion.div>
              ) : !showForm ? (
                <motion.div
                  key="time-slots"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="selected-date-display">
                    <span className="selected-date-display__label">Selected Date</span>
                    <span className="selected-date-display__date">
                      {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  <h3 style={{ marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
                    Available Time Slots
                  </h3>

                  {availableSlots.length === 0 ? (
                    <p className="no-slots-message">
                      No available slots for this date. Please select another date.
                    </p>
                  ) : (
                    <div className="time-slots-grid">
                      {TIME_SLOTS.map(time => {
                        const booked = isSlotBooked(selectedDate.getDate(), time);
                        return (
                          <button
                            key={time}
                            className={`time-slot ${booked ? 'time-slot--booked' : ''} ${selectedTime === time ? 'time-slot--selected' : ''}`}
                            onClick={() => handleTimeSelect(time)}
                            disabled={booked}
                          >
                            {time}
                            {booked && <span className="time-slot__badge">Booked</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <button 
                    className="btn btn--outline" 
                    onClick={() => { setSelectedDate(null); setSelectedTime(null); }}
                    style={{ marginTop: '1.5rem' }}
                  >
                    Change Date
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="booking-form"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  {submitStatus === 'success' ? (
                    <div className="booking-success">
                      <div className="booking-success__icon">✓</div>
                      <h3>Appointment Booked!</h3>
                      <p>Your consultation has been scheduled for:</p>
                      <div className="booking-success__details">
                        <strong>{selectedDate.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</strong>
                        <span>at {selectedTime}</span>
                      </div>
                      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--color-text-light)' }}>
                        A confirmation will be sent to your email.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit}>
                      <div className="selected-date-display selected-date-display--compact">
                        <span className="selected-date-display__date">
                          {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {selectedTime}
                        </span>
                        <button 
                          type="button" 
                          className="change-slot-btn"
                          onClick={() => { setShowForm(false); setSelectedTime(null); }}
                        >
                          Change
                        </button>
                      </div>

                      <h3 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>
                        Your Details
                      </h3>

                      <div className="form-group">
                        <label className="form-label" htmlFor="appt-name">Full Name *</label>
                        <input
                          className="form-input"
                          id="appt-name"
                          name="clientName"
                          type="text"
                          value={formData.clientName}
                          onChange={handleInputChange}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="appt-email">Email Address *</label>
                        <input
                          className="form-input"
                          id="appt-email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter your email"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="appt-phone">Phone Number *</label>
                        <input
                          className="form-input"
                          id="appt-phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter your phone number"
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label" htmlFor="appt-country">Country *</label>
                          <select
                            className="form-select"
                            id="appt-country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="China">China</option>
                            <option value="Japan">Japan</option>
                            <option value="South Korea">South Korea</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label className="form-label" htmlFor="appt-visa">Visa Type *</label>
                          <select
                            className="form-select"
                            id="appt-visa"
                            name="visaType"
                            value={formData.visaType}
                            onChange={handleInputChange}
                            required
                          >
                            {VISA_TYPES[formData.country]?.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label" htmlFor="appt-notes">Additional Notes</label>
                        <textarea
                          className="form-textarea"
                          id="appt-notes"
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Any specific questions or requirements..."
                          rows={3}
                        />
                      </div>

                      <div className="form-actions">
                        <button 
                          type="button" 
                          className="btn btn--outline"
                          onClick={() => setShowForm(false)}
                        >
                          Back
                        </button>
                        <button 
                          type="submit" 
                          className="btn btn--primary"
                          disabled={submitStatus === 'submitting'}
                        >
                          {submitStatus === 'submitting' ? 'Booking...' : 'Confirm Appointment'}
                        </button>
                      </div>

                      {submitStatus === 'error' && (
                        <p className="form-error">Failed to book appointment. Please try again.</p>
                      )}
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
