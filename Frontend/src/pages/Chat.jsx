import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Send, 
  User,
  Phone,
  Video,
  MoreVertical,
  Search,
  Clock
} from 'lucide-react';

const Chat = () => {
  const { state, dispatch } = useApp();
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  // Get conversations
  const conversations = state.users
    .filter(user => user.id !== state.currentUser?.id)
    .map(user => {
      const userMessages = state.messages.filter(m => 
        (m.senderId === user.id && m.receiverId === state.currentUser?.id) ||
        (m.senderId === state.currentUser?.id && m.receiverId === user.id)
      );

      return {
        user,
        messages: userMessages,
        lastMessage: userMessages[userMessages.length - 1],
        unreadCount: userMessages.filter(m => m.senderId === user.id).length
      };
    })
    .filter(conv => conv.messages.length > 0 || conv.user.id === selectedUserId)
    .sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime();
    });

  const selectedConversation = conversations.find(conv => conv.user.id === selectedUserId);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUserId || !state.currentUser) return;

    const message = {
      id: Date.now().toString(),
      senderId: state.currentUser.id,
      receiverId: selectedUserId,
      content: newMessage,
      timestamp: new Date(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: message });
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900 mb-4">Messages</h1>
          
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search conversations..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <button
                  key={conversation.user.id}
                  onClick={() => setSelectedUserId(conversation.user.id)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedUserId === conversation.user.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {conversation.user.avatar ? (
                      <img
                        src={conversation.user.avatar}
                        alt={conversation.user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.user.name}
                        </p>
                        {conversation.lastMessage && (
                          <p className="text-xs text-gray-500">
                            {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      
                      {conversation.lastMessage ? (
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Start a conversation</p>
                      )}
                      
                      {conversation.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                            {conversation.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start by messaging someone from search!</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedConversation.user.avatar ? (
                    <img
                      src={selectedConversation.user.avatar}
                      alt={selectedConversation.user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  
                  <div>
                    <h2 className="font-semibold text-gray-900">{selectedConversation.user.name}</h2>
                    <p className="text-sm text-green-600">Online</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation.messages.length > 0 ? (
                selectedConversation.messages.map((message) => {
                  const isFromCurrentUser = message.senderId === state.currentUser?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        isFromCurrentUser 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center mt-1 text-xs ${
                          isFromCurrentUser ? 'text-blue-200' : 'text-gray-500'
                        }`}>
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex space-x-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h2>
              <p className="text-gray-600">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
