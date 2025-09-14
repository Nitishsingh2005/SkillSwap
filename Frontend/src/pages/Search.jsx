import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { sampleUsers } from '../utils/sampleData';
import { 
  Search as SearchIcon, 
  Filter, 
  MapPin, 
  Star, 
  Video,
  MessageCircle,
  User as UserIcon
} from 'lucide-react';

const Search = () => {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (state.users.length === 0) {
      dispatch({ type: 'SET_USERS', payload: sampleUsers });
    }
  }, [state.users.length, dispatch]);

  useEffect(() => {
    let results = state.users.filter(user => user.id !== state.currentUser?.id);

    if (searchTerm) {
      results = results.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.skills.some(skill => skill.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filters.skill) {
      results = results.filter(user =>
        user.skills.some(skill => skill.name.toLowerCase().includes(filters.skill.toLowerCase()))
      );
    }

    if (filters.category) {
      results = results.filter(user =>
        user.skills.some(skill => skill.category === filters.category)
      );
    }

    if (filters.level) {
      results = results.filter(user =>
        user.skills.some(skill => skill.level === filters.level)
      );
    }

    if (filters.location) {
      results = results.filter(user =>
        user.location.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.videoCallReady !== undefined) {
      results = results.filter(user => user.videoCallReady === filters.videoCallReady);
    }

    setFilteredUsers(results);
  }, [searchTerm, filters, state.users, state.currentUser]);

  const skillCategories = [
    'Frontend', 'Backend', 'Design', 'Data Science', 'Mobile', 'DevOps', 'Marketing', 'Other'
  ];

  const skillLevels = ['Beginner', 'Intermediate', 'Expert'];

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getUserSkillsOffered = (user) => user.skills.filter(skill => skill.offering);
  const getUserSkillsSeeking = (user) => user.skills.filter(skill => !skill.offering);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Skill Partner</h1>
        <p className="text-gray-600">
          Discover people who can teach you new skills or learn from your expertise.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, skills, or bio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skill</label>
              <input
                type="text"
                placeholder="e.g., React, Python"
                value={filters.skill || ''}
                onChange={(e) => setFilters({ ...filters, skill: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Categories</option>
                {skillCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
              <select
                value={filters.level || ''}
                onChange={(e) => setFilters({ ...filters, level: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">All Levels</option>
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                placeholder="City, State"
                value={filters.location || ''}
                onChange={(e) => setFilters({ ...filters, location: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.videoCallReady || false}
                  onChange={(e) => setFilters({ ...filters, videoCallReady: e.target.checked ? true : undefined })}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-700">Video calls available</span>
              </label>
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end">
              <button onClick={clearFilters} className="text-blue-600 hover:text-blue-700 font-medium">
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {filteredUsers.length} {filteredUsers.length === 1 ? 'person' : 'people'} found
        </h2>
        
        {filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(user => {
              const skillsOffered = getUserSkillsOffered(user);
              const skillsSeeking = getUserSkillsSeeking(user);

              return (
                <div key={user.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4 mb-4">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                        <UserIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                        {user.rating > 0 && (
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span>{user.rating.toFixed(1)}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{user.location}</span>
                          </div>
                        )}
                        {user.videoCallReady && (
                          <div className="flex items-center space-x-1 text-green-600">
                            <Video className="w-4 h-4" />
                            <span>Video</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{user.bio}</p>

                  <div className="mb-4">
                    {skillsOffered.length > 0 && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Offers to teach:</h4>
                        <div className="flex flex-wrap gap-1">
                          {skillsOffered.slice(0, 3).map(skill => (
                            <span key={skill.id} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{skill.name}</span>
                          ))}
                          {skillsOffered.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">+{skillsOffered.length - 3} more</span>}
                        </div>
                      </div>
                    )}
                    
                    {skillsSeeking.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Wants to learn:</h4>
                        <div className="flex flex-wrap gap-1">
                          {skillsSeeking.slice(0, 3).map(skill => (
                            <span key={skill.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{skill.name}</span>
                          ))}
                          {skillsSeeking.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">+{skillsSeeking.length - 3} more</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      View Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search terms or filters to find more people.</p>
            <button onClick={clearFilters} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
