import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert, ScrollView, Switch } from 'react-native';
import { LogOut, Camera, User as UserIcon, CreditCard as Edit, Moon, Palette } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme, ThemeType, AccentColor } from '@/context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '@/services/apiClient';

export default function ProfileScreen() {
  const { user, signOut, updateUserProfile } = useAuth();
  const { theme, setTheme, accentColor, setAccentColor, isDark, colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const themeOptions: { label: string; value: ThemeType }[] = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ];

  const accentColors: { label: string; value: AccentColor; gradient: string[] }[] = [
    { label: 'Blue', value: 'blue', gradient: colors.accent.blue },
    { label: 'Purple', value: 'purple', gradient: colors.accent.purple },
    { label: 'Green', value: 'green', gradient: colors.accent.green },
    { label: 'Pink', value: 'pink', gradient: colors.accent.pink },
    { label: 'Orange', value: 'orange', gradient: colors.accent.orange },
  ];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    );
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'You need to allow access to your photos to change your profile picture.');
        return;
      }
      let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsEditing: true, aspect: [4, 3], quality: 1, });
      
      if (!result.canceled) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setUploadingImage(true);
      
      const formData = new FormData();
      formData.append('avatar', {
        uri,
        name: 'avatar.jpg',
        type: 'image/jpeg'
      } as any);
      
      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.avatarUrl) {
        await updateUserProfile({ avatar: response.data.avatarUrl });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
          <LogOut size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          {uploadingImage ? (
            <View style={styles.avatar}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={40} color="#FFFFFF" />
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage}>
            <Camera size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={styles.themeOption}
            onPress={() => setTheme(option.value)}
          >
            <Text style={styles.themeOptionText}>{option.label}</Text>
            {theme === option.value && (
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accent Color</Text>
        
        {accentColors.map((color) => (
          <TouchableOpacity
            key={color.value}
            style={styles.colorOption}
            onPress={() => setAccentColor(color.value)}
          >
            <View
              style={[
                styles.colorPreview,
                {
                  backgroundColor: color.gradient[0],
                },
              ]}
            />
            <Text style={styles.colorOptionText}>{color.label}</Text>
            {accentColor === color.value && (
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary }} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Name</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>{user.name}</Text>
            <Edit size={16} color="#8E8E93" />
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Email</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <View style={styles.infoValueContainer}>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.dangerButton} onPress={handleSignOut}>
        <Text style={styles.dangerButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
  },
  logoutButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.secondaryText,
  },
  section: {
    backgroundColor: colors.secondaryBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    marginBottom: 16,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  themeOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.text,
    flex: 1,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  colorOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.text,
    flex: 1,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: colors.secondaryText,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: colors.text,
    marginRight: 8,
  },
  dangerButton: {
    backgroundColor: colors.secondaryBackground,
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FF3B30',
  },
});