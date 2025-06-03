import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ContactItemProps {
  name: string;
  email: string;
  avatar?: string;
  onPress: () => void;
}

export function ContactItem({ name, email, avatar, onPress }: ContactItemProps) {
  const { colors } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 16,
    },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    avatarInitial: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.secondaryText,
    },
    infoContainer: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.secondaryText,
    },
  });

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {avatar ? (
        <Image source={{ uri: avatar }} style={styles.avatar} />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>
      </View>
    </TouchableOpacity>
  );
}