import { useEffect, useState } from "react";
import "./ParentDashboard.css";

function ParentDashboard() {
  const [showForm, setShowForm] = useState(false);

  const [placeOfVisit, setPlaceOfVisit] = useState("");
  const [reason, setReason] = useState("");
  const [dateRequestedFor, setDateRequestedFor] = useState("");
  const [timeOfLeaving, setTimeOfLeaving] = useState("");
  const [expectedInTime, setExpectedInTime] = useState("");

  const [outpasses, setOutpasses] = useState([]);

  // Linked student
  const [student, setStudent] = useState(null);
  const [studentLoading, setStudentLoading] = useState(true);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // BACKEND URL
  // ==========================================

  const API_URL = import.meta.env.VITE_API_URL;

  // ==========================================
  // FETCH LINKED STUDENT
  // ==========================================

  const fetchStudent = async () => {
    try {
      setStudentLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/my-student`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch linked student"
        );
      }

      setStudent(data.student);

    } catch (error) {
      console.error("Fetch student error:", error);
      setError(error.message);
      setStudent(null);

    } finally {
      setStudentLoading(false);
    }
  };

  // ==========================================
  // FETCH MY OUTPASSES
  // ==========================================

  const fetchOutpasses = async () => {
    try {
      setFetching(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/my`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch outpasses"
        );
      }

      setOutpasses(data.outpasses || []);

    } catch (error) {
      console.error(error);
      setError(error.message);

    } finally {
      setFetching(false);
    }
  };

  // ==========================================
  // LOAD DASHBOARD DATA
  // ==========================================

  useEffect(() => {
    fetchStudent();
    fetchOutpasses();
  }, []);

  // ==========================================
  // SUBMIT OUTPASS
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!student) {
      setError(
        "No student is linked to this parent account."
      );
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/outpass/request`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            // Use the actual linked student's ID
            studentId: student.studentId,

            placeOfVisit,
            reason,
            dateRequestedFor,
            timeOfLeaving,
            expectedInTime,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to submit request"
        );
      }

      setMessage(
        `Outpass request submitted successfully! ID: ${data.outpass?.outpassId}`
      );

      // Clear form
      setPlaceOfVisit("");
      setReason("");
      setDateRequestedFor("");
      setTimeOfLeaving("");
      setExpectedInTime("");

      setShowForm(false);

      // Refresh request history
      fetchOutpasses();

    } catch (error) {
      console.error(error);
      setError(error.message);

    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.reload();
  };

  // ==========================================
  // STATUS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  // ==========================================
  // REFRESH
  // ==========================================

  const handleRefresh = () => {
    setError("");
    fetchStudent();
    fetchOutpasses();
  };

  return (
    <div className="parent-page">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="parent-header">

        <div>
          <h1>🏫 E-Outpass</h1>
          <p>Parent Portal</p>
        </div>

        <button
          className="parent-logout"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>


      {/* ======================================
          MAIN
      ====================================== */}

      <main className="parent-content">


        {/* ====================================
            WELCOME
        ==================================== */}

        <section className="parent-welcome">

          <h2>
            Welcome, Parent
          </h2>

          <p>
            Manage your student's hostel outpasses
            digitally.
          </p>

        </section>


        {/* ====================================
            SUCCESS / ERROR MESSAGE
        ==================================== */}

        {message && (
          <div className="success-box">
            ✅ {message}
          </div>
        )}

        {error && (
          <div className="parent-error-box">
            ❌ {error}
          </div>
        )}


        {/* ====================================
            STUDENT CARD
        ==================================== */}

        <section className="student-card">

          <div className="student-icon">
            👨‍🎓
          </div>

          <div>

            <span>
              Linked Student
            </span>

            {studentLoading ? (

              <h2>
                Loading student...
              </h2>

            ) : student ? (

              <>
                <h2>
                  {student.name}
                </h2>

                <p>
                  {student.course}
                  {" • "}
                  Room {student.roomNumber}
                  {" • "}
                  {student.hostel?.name || "Hostel"}
                </p>
              </>

            ) : (

              <>
                <h2>
                  No Student Linked
                </h2>

                <p>
                  Please contact the administrator.
                </p>
              </>

            )}

          </div>

        </section>


        {/* ====================================
            REQUEST ACTION
        ==================================== */}

        <section className="parent-action">

          <div>

            <h2>
              Need an Outpass?
            </h2>

            <p>
              Submit a request to your hostel warden.
            </p>

          </div>

          <button
            className="request-button"
            onClick={() => {
              setShowForm(!showForm);
              setMessage("");
              setError("");
            }}
            disabled={!student || studentLoading}
          >
            📝 Request Outpass
          </button>

        </section>


        {/* ====================================
            REQUEST FORM
        ==================================== */}

        {showForm && student && (

          <section className="outpass-form-card">

            <div className="form-header">

              <div>

                <h2>
                  Request an Outpass
                </h2>

                <p>
                  Requesting for{" "}
                  <strong>{student.name}</strong>
                </p>

              </div>

              <button
                className="close-form"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>

            </div>


            <form
              className="outpass-form"
              onSubmit={handleSubmit}
            >


              {/* PLACE */}

              <div className="form-group">

                <label>
                  Place of Visit
                </label>

                <input
                  type="text"
                  placeholder="Example: Kochi"
                  value={placeOfVisit}
                  onChange={(e) =>
                    setPlaceOfVisit(e.target.value)
                  }
                  required
                />

              </div>


              {/* REASON */}

              <div className="form-group">

                <label>
                  Reason
                </label>

                <textarea
                  placeholder="Enter reason for the outpass"
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                  rows="3"
                  required
                />

              </div>


              <div className="form-row">


                {/* DATE */}

                <div className="form-group">

                  <label>
                    Date
                  </label>

                  <input
                    type="date"
                    value={dateRequestedFor}
                    onChange={(e) =>
                      setDateRequestedFor(e.target.value)
                    }
                    required
                  />

                </div>


                {/* LEAVING */}

                <div className="form-group">

                  <label>
                    Leaving Time
                  </label>

                  <input
                    type="time"
                    value={timeOfLeaving}
                    onChange={(e) =>
                      setTimeOfLeaving(e.target.value)
                    }
                    required
                  />

                </div>


                {/* RETURN */}

                <div className="form-group">

                  <label>
                    Expected Return
                  </label>

                  <input
                    type="time"
                    value={expectedInTime}
                    onChange={(e) =>
                      setExpectedInTime(e.target.value)
                    }
                    required
                  />

                </div>

              </div>


              <button
                type="submit"
                className="submit-outpass-button"
                disabled={loading}
              >
                {loading
                  ? "Submitting..."
                  : "Submit Outpass Request"}
              </button>

            </form>

          </section>

        )}


        {/* ====================================
            REQUEST HISTORY
        ==================================== */}

        <section className="history-section">

          <div className="history-header">

            <div>

              <h2>
                My Outpass Requests
              </h2>

              <p>
                Track your student's requests.
              </p>

            </div>

            <button
              className="refresh-history"
              onClick={handleRefresh}
            >
              🔄 Refresh
            </button>

          </div>


          {/* LOADING */}

          {fetching && (

            <div className="empty-history">
              Loading requests...
            </div>

          )}


          {/* NO REQUESTS */}

          {!fetching &&
            outpasses.length === 0 && (

              <div className="empty-history">

                <div className="history-icon">
                  📋
                </div>

                <h3>
                  No Requests Yet
                </h3>

                <p>
                  Your submitted outpass requests
                  will appear here.
                </p>

              </div>

            )}


          {/* REQUEST LIST */}

          {!fetching &&
            outpasses.length > 0 && (

              <div className="parent-request-list">

                {outpasses.map((outpass) => (

                  <div
                    className="parent-request-card"
                    key={outpass._id}
                  >

                    <div className="request-top">

                      <div>

                        <h3>
                          {outpass.placeOfVisit}
                        </h3>

                        <p>
                          {outpass.reason}
                        </p>

                      </div>

                      <span
                        className={getStatusClass(
                          outpass.status
                        )}
                      >
                        {outpass.status}
                      </span>

                    </div>


                    <div className="request-info">

                      <div>
                        <span>Date</span>

                        <strong>
                          {new Date(
                            outpass.dateRequestedFor
                          ).toLocaleDateString()}
                        </strong>
                      </div>

                      <div>
                        <span>Leaving</span>

                        <strong>
                          {outpass.timeOfLeaving}
                        </strong>
                      </div>

                      <div>
                        <span>Expected Return</span>

                        <strong>
                          {outpass.expectedInTime}
                        </strong>
                      </div>

                      <div>
                        <span>Outpass ID</span>

                        <strong>
                          {outpass.outpassId}
                        </strong>
                      </div>

                    </div>


                    {/* REJECTION */}

                    {outpass.status === "rejected" &&
                      outpass.rejectionReason && (

                        <div className="rejection-box">

                          ❌ Rejection reason:
                          {" "}
                          {outpass.rejectionReason}

                        </div>

                      )}


                    {/* APPROVED MESSAGE */}

                    {outpass.status === "approved" && (
                      <div className="approved-box">
                        🎉 Your outpass has been approved!
                      </div>
                    )}

                  </div>

                ))}

              </div>

            )}

        </section>

      </main>

    </div>
  );
}

export default ParentDashboard;