// components/Ratings.jsx
import React, { useState, useEffect } from 'react';
import { ratingsAPI, lecturersAPI } from '../services/api';;

const Ratings = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [ratings, setRatings] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [lecturerRatings, setLecturerRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          setLoading(true);
          setError(null);

          // Fetch lecturers
          const lecturersResponse = await lecturersAPI.getLecturers();
          setLecturers(lecturersResponse.data || []);

          // Fetch ratings
          const ratingsResponse = await ratingsAPI.getRatings();
          let allRatings = ratingsResponse.data || [];

          // Filter ratings based on user role
          let filteredRatings = [];
          if (user.role === 'Student') {
            // Students see their own ratings
            filteredRatings = allRatings.filter(rating => rating.user_id === user.user_id);

            // Create lecturer ratings map for pre-filling
            const lecturerRatingsMap = {};
            lecturersResponse.data.forEach(lecturer => {
              const existingRating = allRatings.find(r => r.lecturer_id === lecturer.user_id && r.user_id === user.user_id);
              lecturerRatingsMap[lecturer.user_id] = {
                rating: existingRating ? existingRating.rating : 0,
                comments: existingRating ? existingRating.comments : ''
              };
            });
            setLecturerRatings(lecturerRatingsMap);
          } else if (user.role === 'Lecturer') {
            // Lecturers see ratings given to them
            filteredRatings = allRatings.filter(rating => rating.lecturer_id === user.user_id);
          } else if (user.role === 'Principal Lecturer' || user.role === 'Program Leader') {
            // Admin roles see all ratings
            filteredRatings = allRatings;
          }

          setRatings(filteredRatings);
        } catch (error) {
          console.error('Error fetching data:', error);
          setError('Failed to load ratings data: ' + (error.response?.data?.error || error.message));
          setLecturers([]);
          setRatings([]);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.user_id]); // Changed from [user] to [user?.user_id] to prevent infinite re-renders

  const handleRatingChange = (lecturerId, newRating) => {
    setLecturerRatings(prev => ({
      ...prev,
      [lecturerId]: {
        ...prev[lecturerId],
        rating: newRating
      }
    }));
  };

  const handleCommentChange = (lecturerId, newComment) => {
    setLecturerRatings(prev => ({
      ...prev,
      [lecturerId]: {
        ...prev[lecturerId],
        comments: newComment
      }
    }));
  };

  const handleSubmitRating = async (lecturerId) => {
    try {
      const lecturerRating = lecturerRatings[lecturerId];
      const ratingData = {
        lecturer_id: lecturerId,
        rating: lecturerRating.rating,
        comments: lecturerRating.comments
      };

      await ratingsAPI.submitRating(ratingData);

      // Refresh data
      const ratingsResponse = await ratingsAPI.getRatings();
      let allRatings = ratingsResponse.data || [];
      const filteredRatings = allRatings.filter(r => r.user_id === user.user_id);
      setRatings(filteredRatings);

      // Update lecturer ratings map
      const lecturerRatingsMap = {};
      lecturers.forEach(lecturer => {
        const existingRating = allRatings.find(r => r.lecturer_id === lecturer.user_id && r.user_id === user.user_id);
        lecturerRatingsMap[lecturer.user_id] = {
          rating: existingRating ? existingRating.rating : 0,
          comments: existingRating ? existingRating.comments : ''
        };
      });
      setLecturerRatings(lecturerRatingsMap);

      alert('Rating submitted successfully!');
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating: ' + (error.response?.data?.error || error.message));
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

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading ratings data...</p>
      </div>
    );
  }

  return (
    <div className="ratings-page h-100">
      <div className="row h-100">
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>{(user.role === 'Principal Lecturer' || user.role === 'Program Leader') ? 'All Ratings' : 'My Ratings'}</span>
              <span className="badge bg-dark">{ratings.length} ratings</span>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-warning" role="alert">
                  <strong>Connection Issue:</strong> {error}
                  <div className="mt-2">
                    <small>Please check if the server is running on port 5001.</small>
                  </div>
                </div>
              )}
              
              {ratings.length > 0 ? (
                <div className="list-group">
                  {ratings.map((item) => (
                    <div key={item.rating_id || item.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            {user.role === 'Principal Lecturer' || user.role === 'Program Leader' 
                              ? `${item.user_name || 'User'} → ${item.lecturer_name || 'Lecturer'}`
                              : (user.role === 'Lecturer' 
                                  ? item.user_name || 'Student' 
                                  : item.lecturer_name || 'Lecturer')
                            }
                          </h6>
                          <p className="mb-1 text-muted">{item.comments}</p>
                          <small className="text-muted">
                            {user.role === 'Principal Lecturer' || user.role === 'Program Leader' 
                              ? 'Student Rating' 
                              : (user.role === 'Lecturer' ? 'Student Rating' : 'Lecturer Rating')
                            }
                          </small>
                        </div>
                        <div className="text-end">
                          <div className="mb-1">{renderStars(item.rating)}</div>
                          <span className="badge bg-dark">{item.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !error ? (
                <div className="text-center py-4">
                  <i className="bi bi-star display-1 text-muted"></i>
                  <h5 className="text-muted mt-3">No Ratings Yet</h5>
                  <p className="text-muted">
                    {user.role === 'Lecturer' 
                      ? 'No students have rated you yet.' 
                      : 'You haven\'t rated any lecturers yet.'
                    }
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {user.role === 'Student' && (
          <div className="col-md-4">
            <div className="card">
              <div className="card-header">Rate Lecturers</div>
              <div className="card-body">
                {lecturers.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Lecturer</th>
                          <th>Rating</th>
                          <th>Comments</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lecturers.map((lecturer) => (
                          <tr key={lecturer.user_id}>
                            <td>{lecturer.full_name || lecturer.username}</td>
                            <td>
                              <div className="d-flex justify-content-between">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    className={`btn btn-link p-0 ${star <= (lecturerRatings[lecturer.user_id]?.rating || 0) ? 'text-warning' : 'text-muted'}`}
                                    onClick={() => handleRatingChange(lecturer.user_id, star)}
                                  >
                                    <i className="bi bi-star-fill" style={{ fontSize: '1.2rem' }}></i>
                                  </button>
                                ))}
                              </div>
                              <small className="text-muted">{(lecturerRatings[lecturer.user_id]?.rating || 0)}/5</small>
                            </td>
                            <td>
                              <textarea
                                className="form-control form-control-sm"
                                rows="2"
                                value={lecturerRatings[lecturer.user_id]?.comments || ''}
                                onChange={(e) => handleCommentChange(lecturer.user_id, e.target.value)}
                                placeholder="Comments..."
                              ></textarea>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-dark btn-sm"
                                onClick={() => handleSubmitRating(lecturer.user_id)}
                                disabled={(lecturerRatings[lecturer.user_id]?.rating || 0) === 0}
                              >
                                Submit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <small className="text-danger">No lecturers available</small>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Ratings;