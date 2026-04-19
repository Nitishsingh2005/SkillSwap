import React, { useState, useRef } from "react";
import { useApp } from "../context/AppContext";
import { skillsAPI, authAPI } from "../services/api";
import {
  Camera,
  Plus,
  X,
  Star,
  MapPin,
  Video,
  Edit3,
  Save,
  Github,
  ExternalLink,
  Trash2,
} from "lucide-react";
import Cropper from "react-easy-crop";

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


  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Cropper State
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);

  // Remove Picture Modal State
  const [showRemoveModal, setShowRemoveModal] = useState(false);

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
      
      // Trigger a custom event to refresh skill matches in Search page
      window.dispatchEvent(new CustomEvent('skillUpdated'));
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
      
      // Trigger a custom event to refresh skill matches in Search page
      window.dispatchEvent(new CustomEvent('skillUpdated'));
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


  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        blob.name = "cropped.jpeg";
        resolve(blob);
      }, "image/jpeg");
    });
  };

  const handleCropSubmit = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      setUploadingImage(true);
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("avatar", croppedBlob, "profile.jpg");

      console.log("Uploading cropped profile picture...");

      const response = await authAPI.uploadProfilePicture(formData);

      console.log("Profile picture uploaded successfully:", response);

      // Update local state with new avatar URL
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { avatar: response.user.avatar },
      });

      alert("Profile picture updated successfully!");
      setShowCropModal(false);
      setImageToCrop(null);
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

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setImageToCrop(reader.result);
      setShowCropModal(true);
    });
    reader.readAsDataURL(file);
    
    // Reset file input so same file can be selected again if canceled
    event.target.value = "";
  };

  const handleRemoveProfilePicture = async () => {
    try {
      setUploadingImage(true);
      await authAPI.removeProfilePicture();
      
      dispatch({
        type: "UPDATE_PROFILE",
        payload: { avatar: "" },
      });
      
      setShowRemoveModal(false);
      alert("Profile picture removed successfully!");
    } catch (error) {
      console.error("Error removing profile picture:", error);
      alert(`Failed to remove profile picture: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  if (!state.currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 min-h-screen">
      {/* Profile Header */}
      <div className="bg-surface rounded-3xl shadow-sm p-8 mb-10 border border-border">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative group shrink-0">
            {state.currentUser.avatar ? (
              <img
                src={
                  state.currentUser.avatar.startsWith("http")
                    ? state.currentUser.avatar
                    : `${import.meta.env.VITE_API_URL}${state.currentUser.avatar}`
                }
                alt={state.currentUser.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-surface shadow-md"
                onError={(e) => {
                  console.error("Image load error:", e.target.src);
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            {!state.currentUser.avatar && (
              <div className="w-32 h-32 bg-surface-2 rounded-full flex items-center justify-center border-4 border-surface shadow-md">
                <span className="text-4xl font-display font-medium text-ink tracking-tight">
                  {state.currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isEditing && state.currentUser.avatar && (
              <button
                onClick={() => setShowRemoveModal(true)}
                disabled={uploadingImage}
                className="absolute bottom-1 right-12 bg-surface text-red-500 p-2.5 rounded-full hover:bg-surface-2 transition-transform hover:scale-105 disabled:bg-surface-2 disabled:text-ink-muted disabled:cursor-not-allowed shadow-md border border-border"
                title="Remove profile picture"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            {isEditing && (
              <button
                onClick={handleProfilePictureClick}
                disabled={uploadingImage}
                className="absolute bottom-1 right-1 bg-ink text-surface p-2.5 rounded-full hover:bg-black transition-transform hover:scale-105 disabled:bg-surface-2 disabled:text-ink-muted disabled:cursor-not-allowed shadow-md"
                title="Upload profile picture"
              >
                {uploadingImage ? (
                  <div className="w-5 h-5 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfilePictureChange}
              className="hidden"
            />
          </div>

          {/* Basic Info */}
          <div className="flex-1 w-full text-center md:text-left pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="text-3xl font-display font-medium text-ink bg-surface-2 border border-border rounded-lg px-4 py-2 w-full md:w-auto focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                  />
                ) : (
                  <h1 className="text-3xl font-display font-medium text-ink tracking-tight">
                    {state.currentUser.name}
                  </h1>
                )}
              </div>

              <button
                onClick={() =>
                  isEditing ? handleSaveProfile() : setIsEditing(true)
                }
                className={`flex items-center justify-center space-x-2 px-6 py-2.5 rounded-full font-medium transition-all shadow-sm ${
                  isEditing
                    ? "bg-accent text-white hover:bg-opacity-90 hover:scale-[1.02]"
                    : "border border-border text-ink hover:bg-surface-2"
                }`}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-3 text-ink-muted mb-6">
              {state.currentUser.rating > 0 && (
                <div className="flex items-center space-x-1.5 bg-surface-2 px-3 py-1 rounded-full">
                  <Star className="w-4 h-4 text-accent fill-current" />
                  <span className="font-semibold text-ink">
                    {state.currentUser.rating.toFixed(1)}
                  </span>
                  <span className="text-sm">
                    ({state.currentUser.reviewCount} reviews)
                  </span>
                </div>
              )}

              {(isEditing ? formData.location : state.currentUser.location) && (
                <div className="flex items-center space-x-1.5">
                  <MapPin className="w-4 h-4" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="bg-surface-2 border border-border rounded-md px-3 py-1.5 text-ink focus:ring-2 focus:ring-accent/20 outline-none text-sm w-40"
                      placeholder="Enter location"
                    />
                  ) : (
                    <span className="text-sm font-medium">{state.currentUser.location}</span>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-1.5">
                <Video className={`w-4 h-4 ${state.currentUser.videoCallReady ? "text-green" : ""}`} />
                {isEditing ? (
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.videoCallReady}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          videoCallReady: e.target.checked,
                        })
                      }
                      className="rounded border-border text-accent focus:ring-accent/20"
                    />
                    <span className="text-sm font-medium">Video calls available</span>
                  </label>
                ) : (
                  <span
                    className={`text-sm font-medium ${
                      state.currentUser.videoCallReady
                        ? "text-green"
                        : "text-ink-muted"
                    }`}
                  >
                    {state.currentUser.videoCallReady
                      ? "Video calls available"
                      : "Text only"}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="bg-surface-2/50 rounded-2xl p-5 border border-border">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full bg-surface border border-border rounded-xl p-4 text-ink placeholder-ink-muted/50 focus:ring-2 focus:ring-accent/20 outline-none min-h-[120px] resize-y"
                  placeholder="Tell others about yourself, your background, and what you're passionate about..."
                />
              ) : (
                <p className="text-ink-muted leading-relaxed whitespace-pre-wrap">
                  {state.currentUser.bio ||
                    "No bio added yet. Click edit to add one and help others learn more about you!"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Skills I Want to Learn Section */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-medium text-ink tracking-tight">Skills I Want to Learn</h2>
            <button
              onClick={() => {
                setNewSkill({ ...newSkill, offering: false });
                setShowSkillForm(true);
              }}
              className="flex items-center space-x-2 bg-ink text-surface hover:bg-black px-4 py-2 rounded-full transition-transform hover:scale-105 shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>

          {/* Skills I Want to Learn List */}
          <div className="space-y-4">
            {state.currentUser.skills.filter(skill => !skill.offering).map((skill) => (
              <div
                key={skill._id || skill.id}
                className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-transparent hover:border-border transition-colors group"
              >
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <h3 className="font-semibold text-ink">{skill.name}</h3>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        skill.level === "Expert"
                          ? "bg-green/10 text-green border-green/20"
                          : skill.level === "Intermediate"
                          ? "bg-blue/10 text-blue border-blue/20"
                          : "bg-surface text-ink-muted border-border"
                      }`}
                    >
                      {skill.level}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
                      Learning
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted">{skill.category}</p>
                </div>
                <button
                  onClick={() => handleRemoveSkill(skill._id || skill.id)}
                  className="text-ink-muted hover:text-red-500 p-2 rounded-full hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove skill"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {state.currentUser.skills.filter(skill => !skill.offering).length === 0 && (
              <div className="text-center py-10 bg-surface-2/50 rounded-2xl border border-border border-dashed">
                <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                  <Plus className="w-6 h-6 text-ink-muted" />
                </div>
                <p className="text-ink-muted font-medium">
                  No skills to learn yet.<br />Add some skills you're interested in!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Skills I Want to Teach Section */}
        <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-display font-medium text-ink tracking-tight">Skills I Want to Teach</h2>
            <button
              onClick={() => {
                setNewSkill({ ...newSkill, offering: true });
                setShowSkillForm(true);
              }}
              className="flex items-center space-x-2 bg-ink text-surface hover:bg-black px-4 py-2 rounded-full transition-transform hover:scale-105 shadow-sm text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>

          {/* Skills I Want to Teach List */}
          <div className="space-y-4">
            {state.currentUser.skills.filter(skill => skill.offering).map((skill) => (
              <div
                key={skill._id || skill.id}
                className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-transparent hover:border-border transition-colors group"
              >
                <div className="flex-1">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <h3 className="font-semibold text-ink">{skill.name}</h3>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${
                        skill.level === "Expert"
                          ? "bg-green/10 text-green border-green/20"
                          : skill.level === "Intermediate"
                          ? "bg-blue/10 text-blue border-blue/20"
                          : "bg-surface text-ink-muted border-border"
                      }`}
                    >
                      {skill.level}
                    </span>
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-green/10 text-green border border-green/20">
                      Teaching
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted">{skill.category}</p>
                </div>
                <button
                  onClick={() => handleRemoveSkill(skill._id || skill.id)}
                  className="text-ink-muted hover:text-red-500 p-2 rounded-full hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  title="Remove skill"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {state.currentUser.skills.filter(skill => skill.offering).length === 0 && (
              <div className="text-center py-10 bg-surface-2/50 rounded-2xl border border-border border-dashed">
                <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                  <Plus className="w-6 h-6 text-ink-muted" />
                </div>
                <p className="text-ink-muted font-medium">
                  No teaching skills yet.<br />Add skills you can share!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Skill Form Modal */}
      {showSkillForm && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl shadow-xl border border-border p-6 md:p-8 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-display font-medium text-ink tracking-tight">
                Add New Skill
              </h3>
              <button onClick={() => setShowSkillForm(false)} className="text-ink-muted hover:text-ink p-2 rounded-full hover:bg-surface-2 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-ink mb-3">Skill Type</label>
                <div className="flex space-x-4 bg-surface-2 p-1.5 rounded-xl border border-border">
                  <label className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg cursor-pointer transition-colors ${!newSkill.offering ? 'bg-surface shadow-sm text-ink font-medium' : 'text-ink-muted hover:text-ink'}`}>
                    <input
                      type="radio"
                      name="skillType"
                      checked={!newSkill.offering}
                      onChange={() => setNewSkill({ ...newSkill, offering: false })}
                      className="hidden"
                    />
                    <span>Want to Learn</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg cursor-pointer transition-colors ${newSkill.offering ? 'bg-surface shadow-sm text-ink font-medium' : 'text-ink-muted hover:text-ink'}`}>
                    <input
                      type="radio"
                      name="skillType"
                      checked={newSkill.offering}
                      onChange={() => setNewSkill({ ...newSkill, offering: true })}
                      className="hidden"
                    />
                    <span>Want to Teach</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g., React, Python, Design"
                  value={newSkill.name}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, name: e.target.value })
                  }
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-ink placeholder-ink-muted/50 focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Category</label>
                <select
                  value={newSkill.category}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, category: e.target.value })
                  }
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-ink focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
                >
                  <option value="">Select category</option>
                  {skillCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink mb-2">Level</label>
                <select
                  value={newSkill.level}
                  onChange={(e) =>
                    setNewSkill({ ...newSkill, level: e.target.value })
                  }
                  className="w-full bg-surface-2 border border-border rounded-xl px-4 py-2.5 text-ink focus:ring-2 focus:ring-accent/20 outline-none transition-all appearance-none"
                >
                  {skillLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-border mt-6">
                <button
                  onClick={() => setShowSkillForm(false)}
                  className="flex-1 border border-border text-ink px-4 py-2.5 rounded-full hover:bg-surface-2 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSkill}
                  className="flex-1 bg-ink text-surface px-4 py-2.5 rounded-full hover:bg-black transition-transform hover:scale-105 shadow-sm font-medium"
                >
                  Save Skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portfolio Links Section */}
      <div className="bg-surface rounded-3xl shadow-sm border border-border p-6 md:p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-display font-medium text-ink tracking-tight">
            Portfolio Links
          </h2>
          <button
            onClick={() => setShowPortfolioForm(true)}
            className="flex items-center space-x-2 bg-ink text-surface hover:bg-black px-4 py-2 rounded-full transition-transform hover:scale-105 shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Link</span>
          </button>
        </div>

        {/* Add Portfolio Form */}
        {showPortfolioForm && (
          <div className="mb-8 p-5 md:p-6 bg-surface-2 rounded-2xl border border-border transition-all">
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-semibold text-ink text-lg">
                Add Portfolio Link
              </h3>
              <button 
                onClick={() => setShowPortfolioForm(false)}
                className="text-ink-muted hover:text-ink p-1.5 rounded-full hover:bg-surface transition-colors"
               >
                 <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Platform</label>
                <input
                  type="text"
                  placeholder="e.g., GitHub, Behance, Dribbble"
                  value={newPortfolioLink.platform}
                  onChange={(e) =>
                    setNewPortfolioLink({
                      ...newPortfolioLink,
                      platform: e.target.value,
                    })
                  }
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-ink placeholder-ink-muted/50 focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">URL</label>
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
                  className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-ink placeholder-ink-muted/50 focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleAddPortfolioLink}
                  className="bg-accent text-white px-6 py-2.5 rounded-full hover:bg-opacity-90 transition-transform hover:scale-105 shadow-sm font-medium"
                >
                  Save Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Portfolio Links List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.currentUser.portfolioLinks?.map((link) => (
            <div
              key={link._id || link.id}
              className="flex items-center justify-between p-4 bg-surface-2 rounded-2xl border border-transparent hover:border-border transition-colors group"
            >
              <div className="flex items-center space-x-4 overflow-hidden">
                <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center border border-border shadow-sm shrink-0">
                  {link.platform.toLowerCase().includes("github") ? (
                    <Github className="w-6 h-6 text-ink" />
                  ) : (
                    <ExternalLink className="w-6 h-6 text-ink" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink truncate mb-0.5">
                    {link.platform}
                  </h3>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-accent hover:underline truncate block"
                    title={link.url}
                  >
                    {link.url.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleRemovePortfolioLink(link._id || link.id)}
                className="text-ink-muted hover:text-red-500 p-2 rounded-full hover:bg-surface transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 ml-2"
                title="Remove link"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {(!state.currentUser.portfolioLinks ||
            state.currentUser.portfolioLinks.length === 0) && !showPortfolioForm && (
            <div className="col-span-1 md:col-span-2 text-center py-10 bg-surface-2/50 rounded-2xl border border-border border-dashed">
              <div className="w-12 h-12 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 border border-border shadow-sm">
                <ExternalLink className="w-6 h-6 text-ink-muted" />
              </div>
              <p className="text-ink-muted font-medium">
                No portfolio links added yet.<br />Add some links to showcase your work!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl shadow-xl border border-border p-6 md:p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-display font-medium text-ink tracking-tight">
                Crop Profile Picture
              </h3>
              <button onClick={() => { setShowCropModal(false); setImageToCrop(null); }} className="text-ink-muted hover:text-ink p-2 rounded-full hover:bg-surface-2 transition-colors">
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="relative w-full h-[300px] sm:h-[400px] mb-6 rounded-2xl overflow-hidden bg-surface-2">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-ink mb-2">Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-full accent-ink"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => { setShowCropModal(false); setImageToCrop(null); }}
                className="flex-1 border border-border text-ink px-4 py-2.5 rounded-full hover:bg-surface-2 transition-colors font-medium"
                disabled={uploadingImage}
              >
                Cancel
              </button>
              <button
                onClick={handleCropSubmit}
                disabled={uploadingImage}
                className="flex-1 bg-ink text-surface px-4 py-2.5 rounded-full hover:bg-black transition-transform hover:scale-105 shadow-sm font-medium flex justify-center items-center"
              >
                {uploadingImage ? (
                  <div className="w-5 h-5 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Crop & Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Picture Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl shadow-xl border border-border p-6 md:p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-display font-medium text-ink tracking-tight mb-4 text-center">
              Remove Profile Picture?
            </h3>
            <p className="text-ink-muted text-center mb-8">
              Are you sure you want to remove your profile picture? It will be replaced with a default avatar.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRemoveModal(false)}
                className="flex-1 border border-border text-ink px-4 py-2.5 rounded-full hover:bg-surface-2 transition-colors font-medium"
                disabled={uploadingImage}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveProfilePicture}
                disabled={uploadingImage}
                className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-full hover:bg-red-600 transition-transform hover:scale-105 shadow-sm font-medium flex justify-center items-center"
              >
                 {uploadingImage ? (
                  <div className="w-5 h-5 border-2 border-surface border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Remove"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
