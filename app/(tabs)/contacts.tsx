import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, UserPlus } from 'lucide-react-native';
import { apiClient } from '@/services/apiClient';
import { ContactItem } from '@/components/ContactItem';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function ContactsScreen() {
  const [contacts, setContacts] = useState<User[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 60,
      paddingBottom: 16,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondaryBackground,
      borderRadius: 10,
      marginHorizontal: 16,
      marginBottom: 16,
      paddingHorizontal: 12,
      height: 40,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
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
      paddingHorizontal: 24,
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
      textAlign: 'center',
    },
  }), [colors]);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact => 
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        contact.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchQuery, contacts]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/users');
      // Filter out the current user
      const filteredUsers = response.data.filter((u: User) => u._id !== user?._id);
      setContacts(filteredUsers);
      setFilteredContacts(filteredUsers);
      setError(null);
    } catch (err) {
      setError('Failed to load contacts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContactPress = async (contactId: string) => {
    try {
      // Check if conversation exists or create a new one
      const response = await apiClient.post('/conversations', {
        participantId: contactId
      });
      
      router.push(`/chat/${response.data._id}`);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={colors.secondaryText} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts"
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
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
            onPress={fetchContacts}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ContactItem
              name={item.name}
              email={item.email}
              avatar={item.avatar}
              onPress={() => handleContactPress(item._id)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <UserPlus size={56} color={colors.secondaryText} />
              <Text style={styles.emptyTitle}>No contacts found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery ? 'Try a different search term' : 'Your contacts will appear here'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}