import React, { useState, useEffect } from 'react';
import { classesAPI, reportsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ReportForm = ({ onSubmit }) => {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    class_id: '',
    week_of_reporting: '',
    date_of_lecture: '',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: '',
    actual_students_present: ''
  });
  
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('ReportForm user:', user);
    fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    try {
      const response = await classesAPI.getClasses();
      console.log('Fetched classes for report:', response.data);
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('You must be logged in to submit a report.');
      return;
    }

    setLoading(true);
    
    try {
      const reportData = {
        ...formData,
        lecturer_id: user.user_id // Add logged-in user's ID
      };
      await reportsAPI.addReport(reportData);
      onSubmit();
      // Reset form
      setFormData({
        class_id: '',
        week_of_reporting: '',
        date_of_lecture: '',
        topic_taught: '',
        learning_outcomes: '',
        recommendations: '',
        actual_students_present: ''
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="report-form">
      <div className="row">
        <div className="col-md-6">
          <div className="form-group mb-3">
            <label className="form-label">Class *</label>
            <select
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              className="form-control"
              required
            >
              <option value="">Select Class</option>
              {classes.map(cls => (
                <option key={cls.class_id} value={cls.class_id}>
                  {cls.class_name} - {cls.course_name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="form-group mb-3">
            <label className="form-label">Week of Reporting *</label>
            <input
              type="number"
              name="week_of_reporting"
              value={formData.week_of_reporting}
              onChange={handleChange}
              className="form-control"
              min="1"
              max="52"
              required
            />
          </div>
        </div>
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Date of Lecture *</label>
        <input
          type="date"
          name="date_of_lecture"
          value={formData.date_of_lecture}
          onChange={handleChange}
          className="form-control"
          required
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Topic Taught *</label>
        <input
          type="text"
          name="topic_taught"
          value={formData.topic_taught}
          onChange={handleChange}
          className="form-control"
          placeholder="Enter the topic covered in this lecture"
          required
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Learning Outcomes *</label>
        <textarea
          name="learning_outcomes"
          value={formData.learning_outcomes}
          onChange={handleChange}
          className="form-control"
          rows="3"
          placeholder="Describe what students should be able to do after this lecture..."
          required
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Lecturer's Recommendations *</label>
        <textarea
          name="recommendations"
          value={formData.recommendations}
          onChange={handleChange}
          className="form-control"
          rows="3"
          placeholder="Provide recommendations for improvement or follow-up actions..."
          required
        />
      </div>

      <div className="form-group mb-3">
        <label className="form-label">Actual Number of Students Present *</label>
        <input
          type="number"
          name="actual_students_present"
          value={formData.actual_students_present}
          onChange={handleChange}
          className="form-control"
          min="0"
          required
        />
      </div>

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-dark" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => onSubmit()}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ReportForm;
