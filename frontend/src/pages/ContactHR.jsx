import { useState } from "react";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";

const ContactHR = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [empId, setEmpId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [empIdError, setEmpIdError] = useState("");
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();

  // Name validation
  const handleNameChange = (e) => {
    const input = e.target.value;
    const regex = /^[A-Za-z\s]*$/; // only letters and spaces allowed
    if (input.length > 50) {
      setNameError("Name cannot exceed 50 characters");
    } else if (!regex.test(input)) {
      setNameError("Only letters and spaces are allowed");
    } else {
      setName(input);
      setNameError("");
    }
  };

  // Email validation function
  const validateEmail = (email) => {
    if (!email.includes("@")) return false;
    if (email.length > 254) return false;

    const [localPart, domainPart = ""] = email.split("@");
    if (localPart.length > 64) return false;
    if (domainPart.length > 253) return false;

    const emailRegex = /^[a-z0-9.]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const input = e.target.value;
    setEmail(input);
    if (!validateEmail(input)) {
      setEmailError("Invalid email address");
    } else {
      setEmailError("");
    }
  };

  // Employee ID validation
  const handleEmpIdChange = (e) => {
    let value = e.target.value.toUpperCase();

    // Force EMP prefix
    if (!value.startsWith("EMP")) {
      value = "EMP";
    }

    // Only digits after EMP
    const numbersOnly = value.slice(3).replace(/[^0-9]/g, "");

    // Limit to 8 digits
    const formatted = "EMP" + numbersOnly.slice(0, 8);

    setEmpId(formatted);

    if (numbersOnly.length !== 8) {
      setEmpIdError("Employee ID must be EMP followed by 8 digits");
    } else {
      setEmpIdError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Check for validation errors
    if (nameError || emailError || empIdError) {
      setError("Please fix the errors before submitting.");
      setLoading(false);
      return;
    }

    try {
      const templateParams = {
          name: name,
          email: email,
          empId: empId,
          subject: subject,
          message: message,
};



      await emailjs.send(
        "workpulse_gmail",
        "template_dxazcg5",
        templateParams,
        "lvA1nv5FctgnRN1cT"
      );

      setSuccess(
        "✅ Your message has been sent to HR! We will let you know soon."
      );
      setName("");
      setEmail("");
      setEmpId("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-2xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <img src="Logo.png" alt="Company Logo" className="h-16 w-auto object-contain" />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Need Help?</h2>
          <p className="text-gray-600 text-sm">
            We're here to assist you. Fill out the form below and our HR team will get back to you soon.
          </p>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-green-700 text-sm font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={handleNameChange}
                maxLength={50}
                required
                className={`w-full p-3 border rounded-lg focus:ring-2 transition-all outline-none ${
                  nameError
                    ? "border-red-400 focus:ring-red-400"
                    : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
                }`}
              />
              {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Employee ID</label>
              <input
                type="text"
                placeholder="EMP00000000"
                value={empId}
                onChange={handleEmpIdChange}
                onFocus={() => { if (empId === "") setEmpId("EMP"); }}
                maxLength={11}
                required
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
              />
              {empIdError && <p className="text-red-500 text-xs mt-1">{empIdError}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              placeholder="youremail@example.com"
              value={email}
              onChange={handleEmailChange}
              required
              className={`w-full p-3 border rounded-lg focus:ring-2 transition-all outline-none ${
                emailError
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-blue-500 focus:border-transparent"
              }`}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              placeholder="What is this about?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
            <textarea
              placeholder="Describe your concern or question in detail..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </span>
            ) : (
              "Send Message to HR"
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          Your information is confidential and will only be shared with the HR department.
        </p>
      </div>
    </div>
  );
};

export default ContactHR;
