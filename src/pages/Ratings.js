import React, { useState, useEffect } from 'react';
import { ratingsAPI } from '../services/api';

const Ratings = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [ratings, setRatings] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (user) fetchRatings();
  }, [user]);

  const fetchRatings = async () => {
    try {
      const response = await ratingsAPI.getRatings();
      setRatings(response.data);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    try {
      await ratingsAPI.submitRating({
        class_id: selectedClass,
        rating,
        comments: comment
      });
      setRating(0);
      setComment('');
      setSelectedClass('');
      fetchRatings();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const renderStars = (rating) =>
    [...Array(5)].map((_, index) => (
      <i
        key={index}
        className={`bi ${index < rating ? 'bi-star-fill text-warning' : 'bi-star'}`}
      ></i>
    ));

  if (!user) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted">You must be logged in to view this page.</h4>
      </div>
    );
  }

  return (
    <div className="ratings-page h-100">
      <div className="row h-100">
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>My Ratings</span>
              <span className="badge bg-dark">{ratings.length} ratings</span>
            </div>
            <div className="card-body">
              {ratings.length > 0 ? (
                <div className="list-group">
                  {ratings.map((item) => (
                    <div key={item.rating_id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">{item.class_name}</h6>
                          <p className="mb-1 text-muted">{item.comments}</p>
                          <small className="text-muted">{item.course_name}</small>
                        </div>
                        <div className="text-end">
                          <div className="mb-1">{renderStars(item.rating)}</div>
                          <span className="badge bg-dark">{item.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-star display-1 text-muted"></i>
                  <h5 className="text-muted mt-3">No Ratings Yet</h5>
                  <p className="text-muted">You haven't rated any classes yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {user.role === 'Student' && (
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">Rate a Class</div>
              <div className="card-body">
                <form onSubmit={handleSubmitRating}>
                  <div className="mb-3">
                    <label className="form-label">Select Class</label>
                    <select
                      className="form-select"
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      required
                    >
                      <option value="">Choose a class...</option>
                      <option value="1">Object Oriented Programming</option>
                      <option value="2">Database Systems</option>
                      <option value="3">Web Development</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Rating</label>
                    <div className="d-flex justify-content-between mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`btn btn-link p-0 ${star <= rating ? 'text-warning' : 'text-muted'}`}
                          onClick={() => setRating(star)}
                        >
                          <i className="bi bi-star-fill" style={{ fontSize: '1.5rem' }}></i>
                        </button>
                      ))}
                    </div>
                    <div className="text-center">
                      <small className="text-muted">{rating}/5 Stars</small>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Comments</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Share your experience with this class..."
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-dark w-100"
                    disabled={!selectedClass || rating === 0}
                  >
                    Submit Rating
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ratings;
