import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { skillsAPI, authAPI } from "../services/api";
import {
  Camera,
  Plus,
  X,
  Star,
  MapPin,
  Calendar,
  Video,
  Edit3,
  Save,
  Github,
  ExternalLink,
} from "lucide-react";

const Profile = () => {
  const { state, dispatch } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: state.currentUser?.name || "",
    bio: state.currentUser?.bio || "",
    location: state.currentUser?.location || "",
    videoCallReady: state.currentUser?.videoCallReady || false,
  });

  const [newSkill, setNewSkill] = useState({
    name: "",
    category: "",
    level: "Beginner",
    offering: true,
  });

  const [newPortfolioLink, setNewPortfolioLink] = useState({
    platform: "",
    url: "",
  });

  const [newAvailability, setNewAvailability] = useState({
    day: "",
    timeSlots: [""],
  });

  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const skillCategories = [
    "Frontend",
    "Backend",
    "Design",
    "Data Science",
    "Mobile",
    "DevOps",
    "Marketing",
    "Other",
  ];

  const skillLevels = ["Beginner", "Intermediate", "Expert"];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleSaveProfile = async () => {
    try {
      console.log("Saving profile:", formData);

      const response = await authAPI.updateProfile(formData);

      console.log("Profile updated successfully:", response);

      dispatch({
        type: "UPDATE_PROFILE",
        payload: formData,
      });

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert(`Failed to update profile: ${error.message}`);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.category) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      console.log("Adding skill:", newSkill);
      console.log("Current user ID:", state.currentUser._id);

      const response = await skillsAPI.addSkill(
        state.currentUser._id,
        newSkill
      );

      console.log("Skill added successfully:", response);

      // Update local state with the response from the server
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { skills: response.user.skills },
      });

      setNewSkill({
        name: "",
        category: "",
        level: "Beginner",
        offering: true,
      });
      setShowSkillForm(false);

      alert("Skill added successfully!");
    } catch (error) {
      console.error("Error adding skill:", error);
      alert(`Failed to add skill: ${error.message}`);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      console.log("Removing skill:", skillId);

      await skillsAPI.removeSkill(state.currentUser._id, skillId);

      console.log("Skill removed successfully");

      // Update local state
      const updatedSkills =
        state.currentUser?.skills.filter((skill) => skill._id !== skillId) ||
        [];
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { skills: updatedSkills },
      });

      alert("Skill removed successfully!");
    } catch (error) {
      console.error("Error removing skill:", error);
      alert(`Failed to remove skill: ${error.message}`);
    }
  };

  const handleAddPortfolioLink = async () => {
    if (!newPortfolioLink.platform || !newPortfolioLink.url) {
      alert("Please fill in both platform and URL");
      return;
    }

    try {
      console.log("Adding portfolio link:", newPortfolioLink);

      const response = await authAPI.addPortfolioLink(newPortfolioLink);

      console.log("Portfolio link added successfully:", response);

      // Update local state with the response from the server
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { portfolioLinks: response.user.portfolioLinks },
      });

      setNewPortfolioLink({ platform: "", url: "" });
      setShowPortfolioForm(false);

      alert("Portfolio link added successfully!");
    } catch (error) {
      console.error("Error adding portfolio link:", error);
      alert(`Failed to add portfolio link: ${error.message}`);
    }
  };

  const handleRemovePortfolioLink = async (linkId) => {
    try {
      console.log("Removing portfolio link:", linkId);

      await authAPI.removePortfolioLink(linkId);

      console.log("Portfolio link removed successfully");

      // Update local state
      const updatedLinks =
        state.currentUser?.portfolioLinks.filter(
          (link) => link._id !== linkId
        ) || [];
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { portfolioLinks: updatedLinks },
      });

      alert("Portfolio link removed successfully!");
    } catch (error) {
      console.error("Error removing portfolio link:", error);
      alert(`Failed to remove portfolio link: ${error.message}`);
    }
  };

  const handleAddAvailability = async () => {
    if (
      !newAvailability.day ||
      newAvailability.timeSlots.some((slot) => !slot.trim())
    ) {
      alert("Please fill in day and all time slots");
      return;
    }

    try {
      console.log("Adding availability:", newAvailability);

      const response = await authAPI.addAvailability(newAvailability);

      console.log("Availability added successfully:", response);

      // Update local state with the response from the server
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { availability: response.user.availability },
      });

      setNewAvailability({ day: "", timeSlots: [""] });
      setShowAvailabilityForm(false);

      alert("Availability added successfully!");
    } catch (error) {
      console.error("Error adding availability:", error);
      alert(`Failed to add availability: ${error.message}`);
    }
  };

  const handleRemoveAvailability = async (slotId) => {
    try {
      console.log("Removing availability slot:", slotId);

      await authAPI.removeAvailability(slotId);

      console.log("Availability slot removed successfully");

      // Update local state
      const updatedAvailability =
        state.currentUser?.availability.filter((slot) => slot._id !== slotId) ||
        [];
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { availability: updatedAvailability },
      });

      alert("Availability slot removed successfully!");
    } catch (error) {
      console.error("Error removing availability slot:", error);
      alert(`Failed to remove availability slot: ${error.message}`);
    }
  };

  const handleAddTimeSlot = () => {
    setNewAvailability({
      ...newAvailability,
      timeSlots: [...newAvailability.timeSlots, ""],
    });
  };

  const handleRemoveTimeSlot = (index) => {
    const updatedSlots = newAvailability.timeSlots.filter(
      (_, i) => i !== index
    );
    setNewAvailability({
      ...newAvailability,
      timeSlots: updatedSlots.length > 0 ? updatedSlots : [""],
    });
  };

  const handleTimeSlotChange = (index, value) => {
    const updatedSlots = [...newAvailability.timeSlots];
    updatedSlots[index] = value;
    setNewAvailability({
      ...newAvailability,
      timeSlots: updatedSlots,
    });
  };

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    try {
      setUploadingImage(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("avatar", file);

      console.log("Uploading profile picture...");

      const response = await authAPI.uploadProfilePicture(formData);

      console.log("Profile picture uploaded successfully:", response);
      console.log("New avatar URL:", response.user.avatar);
      console.log("Current user before update:", state.currentUser);

      // Update local state with new avatar URL
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { avatar: response.user.avatar },
      });

      console.log("Profile update dispatched");

      alert("Profile picture updated successfully!");
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      alert(`Failed to upload profile picture: ${error.message}`);
    } finally {
      setUploadingImage(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (!state.currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 min-h-screen">
      {/* Profile Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-lg p-8 mb-8 border border-slate-700/50">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative">
            {state.currentUser.avatar ? (
              <img
                src={
                  state.currentUser.avatar.startsWith("http")
                    ? state.currentUser.avatar
                    : `http://localhost:5000${state.currentUser.avatar}`
                }
                alt={state.currentUser.name}
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-600"
                onError={(e) => {
                  console.error("Image load error:", e.target.src);
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            {!state.currentUser.avatar && (
              <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                <span className="text-2xl font-bold text-slate-200 tracking-tight">
                  {state.currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              onClick={handleProfilePictureClick}
              disabled={uploadingImage}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              title="Upload profile picture"
            >
              {uploadingImage ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">
                  {state.currentUser.name}
                </h1>
              )}

              <button
                onClick={() =>
                  isEditing ? handleSaveProfile() : setIsEditing(true)
                }
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center space-x-6 text-gray-600 mb-4">
              {state.currentUser.rating > 0 && (
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-medium">
                    {state.currentUser.rating.toFixed(1)}
                  </span>
                  <span>({state.currentUser.reviewCount} reviews)</span>
                </div>
              )}

              {(isEditing ? formData.location : state.currentUser.location) && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-5 h-5" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="border border-gray-300 rounded px-2 py-1"
                      placeholder="Enter location"
                    />
                  ) : (
                    <span>{state.currentUser.location}</span>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Video className="w-5 h-5" />
                {isEditing ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.videoCallReady}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          videoCallReady: e.target.checked,
                        })
                      }
                      className="rounded"
                    />
                    <span>Video calls available</span>
                  </label>
                ) : (
                  <span
                    className={
                      state.currentUser.videoCallReady
                        ? "text-green-600"
                        : "text-gray-500"
                    }
                  >
                    {state.currentUser.videoCallReady
                      ? "Video calls available"
                      : "Text only"}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Tell others about yourself and your skills..."
                />
              ) : (
                <p className="text-gray-700">
                  {state.currentUser.bio ||
                    "No bio added yet. Click edit to add one!"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Skills Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Skills</h2>
            <button
              onClick={() => setShowSkillForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>

          {/* Add Skill Form */}
          {showSkillForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">Add New Skill</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Skill name (e.g., React, Python)"
                  value={newSkill.name}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />

                <select
                  value={newSkill.category}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, category: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select category</option>
                  {skillCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <select
                  value={newSkill.level}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, level: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {skillLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSkill.offering}
                    onChange={(e) =>
                      setNewSkill({ ...newSkill, offering: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">
                    I'm offering to teach this skill
                  </span>
                </label>

                <div className="flex space-x-2">
                  <button
                    onClick={handleAddSkill}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Skill
                  </button>
                  <button
                    onClick={() => setShowSkillForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Skills List */}
          <div className="space-y-3">
            {state.currentUser.skills.map((skill) => (
              <div
                key={skill._id || skill.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="font-medium text-gray-900">{skill.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        skill.level === "Expert"
                          ? "bg-green-100 text-green-700"
                          : skill.level === "Intermediate"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {skill.level}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        skill.offering
                          ? "bg-purple-100 text-purple-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {skill.offering ? "Teaching" : "Learning"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{skill.category}</p>
                </div>
                <button
                  onClick={() => handleRemoveSkill(skill._id || skill.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {state.currentUser.skills.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No skills added yet. Add your first skill to get started!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Links Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Portfolio Links
            </h2>
            <button
              onClick={() => setShowPortfolioForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>

          {/* Add Portfolio Form */}
          {showPortfolioForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">
                Add Portfolio Link
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Platform name (e.g., GitHub, Behance)"
                  value={newPortfolioLink.platform}
                  onChange={(e) =>
                    setNewPortfolioLink({
                      ...newPortfolioLink,
                      platform: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />

                <input
                  type="url"
                  placeholder="https://example.com/your-profile"
                  value={newPortfolioLink.url}
                  onChange={(e) =>
                    setNewPortfolioLink({
                      ...newPortfolioLink,
                      url: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />

                <div className="flex space-x-2">
                  <button
                    onClick={handleAddPortfolioLink}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Link
                  </button>
                  <button
                    onClick={() => setShowPortfolioForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Portfolio Links List */}
          <div className="space-y-3">
            {state.currentUser.portfolioLinks?.map((link) => (
              <div
                key={link._id || link.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {link.platform.toLowerCase().includes("github") ? (
                      <Github className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {link.platform}
                    </h3>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 break-all"
                    >
                      {link.url}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePortfolioLink(link._id || link.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {(!state.currentUser.portfolioLinks ||
              state.currentUser.portfolioLinks.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No portfolio links added yet. Showcase your work!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Availability Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Availability
            </h2>
            <button
              onClick={() => setShowAvailabilityForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Set Availability</span>
            </button>
          </div>

          {/* Add Availability Form */}
          {showAvailabilityForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-4">
                Add Availability
              </h3>
              <div className="space-y-4">
                <select
                  value={newAvailability.day}
                  onChange={(e) =>
                    setNewAvailability({
                      ...newAvailability,
                      day: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select day</option>
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slots
                  </label>
                  {newAvailability.timeSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 mb-2"
                    >
                      <input
                        type="text"
                        placeholder="e.g., 09:00-12:00"
                        value={slot}
                        onChange={(e) =>
                          handleTimeSlotChange(index, e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                      />
                      {newAvailability.timeSlots.length > 1 && (
                        <button
                          onClick={() => handleRemoveTimeSlot(index)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={handleAddTimeSlot}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add time slot</span>
                  </button>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={handleAddAvailability}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Add Availability
                  </button>
                  <button
                    onClick={() => setShowAvailabilityForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Availability List */}
          <div className="space-y-3">
            {state.currentUser.availability?.map((slot) => (
              <div
                key={slot._id || slot.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="font-medium text-gray-900">{slot.day}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slot.timeSlots.map((time, timeIndex) => (
                      <span
                        key={timeIndex}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                      >
                        {time}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAvailability(slot._id || slot.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {(!state.currentUser.availability ||
              state.currentUser.availability.length === 0) && (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  No availability set yet. Let others know when you're free!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
