import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import * as sodium from 'libsodium-wrappers';

interface Message {
  _id: string;
  sender: string;
  content: string;
  encrypted?: boolean;
  createdAt: string;
}

interface ChatData {
  _id: string;
  participants: string[];
  messages: Message[];
}

const API_URL = 'http://localhost:5002/api';

const AdminChat: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const { token } = useAuth();
  const [chat, setChat] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const response = await axios.get(`${API_URL}/chats/${chatId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const chatData = response.data.chat;

        await (sodium as any).ready;

        const decryptedMessages = await Promise.all(
          chatData.messages.map(async (msg: Message) => {
            if (msg.encrypted) {
              const senderId = msg.sender;
              const recipientId = chatData.participants.find((p: string) => p !== senderId);

              if (recipientId) {
                const privateKey = localStorage.getItem(`chat_privkey_${recipientId}`);
                const senderPublicKey = localStorage.getItem(`chat_pubkey_${senderId}`);

                if (privateKey && senderPublicKey) {
                  try {
                    const senderPubKey = (sodium as any).from_hex(senderPublicKey);
                    const combined = (sodium as any).from_base64(msg.content, 'base64');
                    const nonceLength = (sodium as any).crypto_box_NONCEBYTES;
                    const nonce = combined.slice(0, nonceLength);
                    const ciphertext = combined.slice(nonceLength);
                    const decrypted = (sodium as any).crypto_box_open_easy(
                      ciphertext,
                      nonce,
                      senderPubKey,
                      (sodium as any).from_hex(privateKey)
                    );
                    return { ...msg, content: (sodium as any).to_string(decrypted) };
                  } catch (e) {
                    console.error('Decryption failed:', e);
                    return { ...msg, content: '[Encrypted Message - Decryption Failed]' };
                  }
                }
              }
            }
            return msg;
          })
        );

        setChat({ ...chatData, messages: decryptedMessages });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching chat:', error);
        setLoading(false);
      }
    };

    fetchChat();
  }, [chatId, token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!chat) {
    return <div>Chat not found</div>;
  }

  return (
    <div>
      <h1>Chat History</h1>
      <ul>
        {chat.messages.map((msg) => (
          <li key={msg._id}>
            <strong>{msg.sender}:</strong> {msg.content}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminChat;
