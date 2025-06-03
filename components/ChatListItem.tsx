import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';

interface ChatListItemProps {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  onPress: () => void;
}

const createStyles = (colors: any, accentColor: string, isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatarInitial: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 56,
  },
  unreadBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.messageBubble.sent.background,
    borderWidth: 2,
    borderColor: colors.background,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: colors.text,
    flex: 1,
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: colors.secondaryText,
    marginLeft: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: colors.secondaryText,
    flex: 1,
  },
  unreadMessage: {
    fontFamily: 'Inter-Medium',
    color: colors.text,
  },
  indicator: {
    backgroundColor: isDark ? colors.messageBubble.sent.background + '20' : colors.messageBubble.sent.background + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  indicatorText: {
    fontSize: 10,
    fontFamily: 'Inter-Medium',
    color: colors.messageBubble.sent.background,
  },
});

export function ChatListItem({ id, name, avatar, lastMessage, time, unread, onPress }: ChatListItemProps) {
  const { colors, accentColor, isDark } = useTheme();
  
  const styles = useMemo(() => createStyles(colors, accentColor, isDark), [colors, accentColor, isDark]);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.avatarContainer}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <LinearGradient
              colors={colors.accent[accentColor]}
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </View>
        )}
        {unread && <View style={styles.unreadBadge} />}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text 
            style={[styles.message, unread && styles.unreadMessage]}
            numberOfLines={1}
          >
            {lastMessage}
          </Text>
          {unread && (
            <View style={styles.indicator}>
              <Text style={styles.indicatorText}>New</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}