import { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  FlatList, 
  ActivityIndicator,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '@/services/apiClient';
import { useAuth } from '@/context/AuthContext';
import { io } from 'socket.io-client';
import { API_URL } from '@/constants/Api';
import { useTheme } from '@/context/ThemeContext';

interface Message {
  _id: string;
  sender: string;
  text: string;
  read: boolean;
  createdAt: string;
  conversation: string;
}

interface Participant {
  _id: string;
  name: string;
  avatar?: string;
  email: string;
}

interface Conversation {
  _id: string;
  participants: Participant[];
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  
  const socket = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const otherParticipant = conversation?.participants.find(
    p => p._id !== user?._id
  );
  
  useEffect(() => {
    socket.current = io(API_URL);
    
    if (id) {
      socket.current.emit('join', id);
    }
    
    socket.current.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      if (message.sender !== user?._id) {
        markMessagesAsRead();
      }
    });
    
    socket.current.on('typing', (data: { user: string; isTyping: boolean }) => {
      if (data.user !== user?._id) {
        setPartnerIsTyping(data.isTyping);
      }
    });
    
    fetchConversationData();
    
    return () => {
      if (id) {
        socket.current.emit('leave', id);
      }
      socket.current.disconnect();
    };
  }, [id]);
  
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  useEffect(() => {
    if (messages.length > 0) {
      markMessagesAsRead();
    }
  }, [messages]);
  
  const fetchConversationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const conversationResponse = await apiClient.get(`/conversations/${id}`);
      setConversation(conversationResponse.data);
      
      const messagesResponse = await apiClient.get(`/conversations/${id}/messages`);
      setMessages(messagesResponse.data);
      
      markMessagesAsRead();
    } catch (err) {
      console.error('Error fetching conversation data:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };
  
  const markMessagesAsRead = async () => {
    try {
      await apiClient.patch(`/conversations/${id}/read`);
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;
    
    try {
      setSendingMessage(true);
      
      await apiClient.post(`/conversations/${id}/messages`, {
        text: newMessage.trim()
      });
      
      setNewMessage('');
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    if (!isTyping) {
      setIsTyping(true);
      socket.current?.emit('typing', {
        conversationId: id,
        user: user?._id,
        isTyping: true
      });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.current?.emit('typing', {
        conversationId: id,
        user: user?._id,
        isTyping: false
      });
    }, 1000);
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender === user?._id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={[
          styles.messageTime,
          isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
        ]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {isOwnMessage && (
            <Text style={styles.readStatus}>
              {' '}{item.read ? '✓✓' : '✓'}
            </Text>
          )}
        </Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            {otherParticipant?.avatar ? (
              <Image source={{ uri: otherParticipant.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {otherParticipant?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            <View>
              <Text style={styles.headerName}>{otherParticipant?.name}</Text>
              {partnerIsTyping ? (
                <Text style={styles.typingIndicator}>typing...</Text>
              ) : (
                <Text style={styles.headerSubtitle}>Tap to view profile</Text>
              )}
            </View>
          </View>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchConversationData}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptySubtitle}>Start the conversation!</Text>
              </View>
            }
          />
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.secondaryText}
            value={newMessage}
            onChangeText={handleTyping}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || sendingMessage}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small\" color={colors.messageBubble.sent.text} />
            ) : (
              <Send size={20} color={colors.messageBubble.sent.text} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.secondaryText,
  },
  headerName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.secondaryText,
  },
  typingIndicator: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.primary,
    fontStyle: 'italic',
  },
  messagesContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: colors.background,
  },
  messageContainer: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  ownMessageBubble: {
    backgroundColor: colors.messageBubble.sent.background,
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: colors.messageBubble.received.background,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter-Regular',
  },
  ownMessageText: {
    color: colors.messageBubble.sent.text,
  },
  otherMessageText: {
    color: colors.messageBubble.received.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    fontFamily: 'Inter-Regular',
    color: colors.secondaryText,
  },
  ownMessageTime: {
    alignSelf: 'flex-end',
  },
  otherMessageTime: {
    alignSelf: 'flex-start',
  },
  readStatus: {
    color: colors.secondaryText,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.messageBubble.sent.background,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.secondaryText,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.messageBubble.sent.background,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.messageBubble.sent.text,
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.secondaryText,
    marginTop: 8,
  },
});