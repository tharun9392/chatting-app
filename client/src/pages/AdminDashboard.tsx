import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

interface User {
  _id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
}

interface Chat {
  _id: string;
  participants: string[];
  lastActivity: string;
}

const API_URL = 'http://localhost:5002/api';

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersResponse, chatsResponse] = await Promise.all([
          axios.get(`${API_URL}/users/all`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/chats/all`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setUsers(usersResponse.data.users || usersResponse.data);
        setChats(chatsResponse.data.chats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, token, navigate]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500">Loading data...</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4">Users</h2>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Username</th>
                  <th className="px-4 py-2 text-left">Role</th>
                  <th className="px-4 py-2 text-left">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{user.username}</td>
                    <td className="px-4 py-2">{user.isAdmin ? 'Admin' : 'User'}</td>
                    <td className="px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-xl font-bold mb-4">Chats</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Chat ID</th>
                  <th className="px-4 py-2 text-left">Participants</th>
                  <th className="px-4 py-2 text-left">Last Activity</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chats.map(chat => (
                  <tr key={chat._id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="px-4 py-2">{chat._id}</td>
                    <td className="px-4 py-2">{chat.participants.join(', ')}</td>
                    <td className="px-4 py-2">{new Date(chat.lastActivity).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <button 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2"
                        onClick={() => navigate(`/admin/chat/${chat._id}`)}
                      >
                        View Chat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 