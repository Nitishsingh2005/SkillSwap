import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
  ExternalLink
} from 'lucide-react';

const Profile = () => {
  const { state, dispatch } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: state.currentUser?.name || '',
    bio: state.currentUser?.bio || '',
    location: state.currentUser?.location || '',
    videoCallReady: state.currentUser?.videoCallReady || false,
  });

  const [newSkill, setNewSkill] = useState({
    name: '',
    category: '',
    level: 'Beginner',
    offering: true,
  });

  const [newPortfolioLink, setNewPortfolioLink] = useState({
    platform: '',
    url: '',
  });

  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const skillCategories = [
    'Frontend', 'Backend', 'Design', 'Data Science', 'Mobile', 'DevOps', 'Marketing', 'Other'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Expert'];

  const handleSaveProfile = () => {
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: formData
    });
    setIsEditing(false);
  };

  const handleAddSkill = () => {
    if (!newSkill.name || !newSkill.category) return;

    const skill = {
      id: Date.now().toString(),
      ...newSkill,
    };

    const updatedSkills = [...(state.currentUser?.skills || []), skill];
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: { skills: updatedSkills }
    });

    setNewSkill({ name: '', category: '', level: 'Beginner', offering: true });
    setShowSkillForm(false);
  };

  const handleRemoveSkill = (skillId) => {
    const updatedSkills = state.currentUser?.skills.filter(skill => skill.id !== skillId) || [];
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: { skills: updatedSkills }
    });
  };

  const handleAddPortfolioLink = () => {
    if (!newPortfolioLink.platform || !newPortfolioLink.url) return;

    const updatedLinks = [...(state.currentUser?.portfolioLinks || []), newPortfolioLink];
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: { portfolioLinks: updatedLinks }
    });

    setNewPortfolioLink({ platform: '', url: '' });
    setShowPortfolioForm(false);
  };

  const handleRemovePortfolioLink = (index) => {
    const updatedLinks = state.currentUser?.portfolioLinks.filter((_, i) => i !== index) || [];
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: { portfolioLinks: updatedLinks }
    });
  };

  if (!state.currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative">
            {state.currentUser.avatar ? (
              <img
                src={state.currentUser.avatar}
                alt={state.currentUser.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {state.currentUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 border border-gray-300 rounded-lg px-3 py-2"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{state.currentUser.name}</h1>
              )}
              
              <button
                onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
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
                  <span className="font-medium">{state.currentUser.rating.toFixed(1)}</span>
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
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
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
                      onChange={(e) => setFormData({ ...formData, videoCallReady: e.target.checked })}
                      className="rounded"
                    />
                    <span>Video calls available</span>
                  </label>
                ) : (
                  <span className={state.currentUser.videoCallReady ? 'text-green-600' : 'text-gray-500'}>
                    {state.currentUser.videoCallReady ? 'Video calls available' : 'Text only'}
                  </span>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="mb-4">
              {isEditing ? (
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Tell others about yourself and your skills..."
                />
              ) : (
                <p className="text-gray-700">
                  {state.currentUser.bio || 'No bio added yet. Click edit to add one!'}
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
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select category</option>
                  {skillCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>

                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  {skillLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>

                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newSkill.offering}
                    onChange={(e) => setNewSkill({ ...newSkill, offering: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">I'm offering to teach this skill</span>
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
              <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="font-medium text-gray-900">{skill.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      skill.level === 'Expert' 
                        ? 'bg-green-100 text-green-700'
                        : skill.level === 'Intermediate'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {skill.level}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      skill.offering
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {skill.offering ? 'Teaching' : 'Learning'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{skill.category}</p>
                </div>
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {state.currentUser.skills.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No skills added yet. Add your first skill to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Links Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Portfolio Links</h2>
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
              <h3 className="font-medium text-gray-900 mb-4">Add Portfolio Link</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Platform name (e.g., GitHub, Behance)"
                  value={newPortfolioLink.platform}
                  onChange={(e) => setNewPortfolioLink({ ...newPortfolioLink, platform: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                
                <input
                  type="url"
                  placeholder="https://example.com/your-profile"
                  value={newPortfolioLink.url}
                  onChange={(e) => setNewPortfolioLink({ ...newPortfolioLink, url: e.target.value })}
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
            {state.currentUser.portfolioLinks?.map((link, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {link.platform.toLowerCase().includes('github') ? (
                      <Github className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{link.platform}</h3>
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
                  onClick={() => handleRemovePortfolioLink(index)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {(!state.currentUser.portfolioLinks || state.currentUser.portfolioLinks.length === 0) && (
              <div className="text-center py-8">
                <p className="text-gray-500">No portfolio links added yet. Showcase your work!</p>
              </div>
            )}
          </div>
        </div>

        {/* Availability Section */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Availability</h2>
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Calendar className="w-4 h-4" />
              <span>Set Availability</span>
            </button>
          </div>

          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Availability calendar coming soon! For now, coordinate directly through messages.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
