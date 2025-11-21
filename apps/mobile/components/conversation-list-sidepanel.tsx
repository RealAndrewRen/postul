import { LiquidGlassView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { defaultFontFamily } from '@/constants/theme';
import { apiService, Idea } from '@/services/api';

interface ConversationListSidepanelProps {
  visible: boolean;
  onClose: () => void;
}

export function ConversationListSidepanel({
  visible,
  onClose,
}: ConversationListSidepanelProps) {
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));

  useEffect(() => {
    if (visible) {
      fetchIdeas();
      // Animate slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Animate slide out
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const fetchIdeas = async () => {
    try {
      setIsLoading(true);
      const fetchedIdeas = await apiService.getIdeas();
      setIdeas(fetchedIdeas);
    } catch (error: any) {
      console.error('Error fetching ideas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const handleSelectIdea = (idea: Idea) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
    // Navigate to project detail if project_id exists, otherwise show idea details
    if (idea.project_id) {
      router.push(`/project/${idea.project_id}` as any);
    }
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Sidepanel */}
        <Animated.View
          style={[
            styles.sidepanel,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}>
          <LinearGradient
            colors={['#E0D9E8', '#F2C5D6', '#F6D3B5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Conversations</Text>
              <Pressable
                style={styles.closeButton}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onClose();
                }}>
                <LiquidGlassView style={styles.closeButtonInner} interactive effect="clear">
                  <Ionicons name="close" size={24} color="#444" />
                </LiquidGlassView>
              </Pressable>
            </View>

            {/* New Conversation Button */}
            <View style={styles.newConversationContainer}>
              <Pressable
                style={styles.newConversationButton}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }
                  onClose();
                  // Navigate to home to start new conversation
                  router.push('/(tabs)/' as any);
                }}>
                <LinearGradient
                  colors={['#FF4444', '#0066FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.newConversationGradient}>
                  <LiquidGlassView style={styles.newConversationInner} interactive effect="clear">
                    <Ionicons name="add" size={20} color="#fff" />
                    <Text style={styles.newConversationText}>New Conversation</Text>
                  </LiquidGlassView>
                </LinearGradient>
              </Pressable>
            </View>

            {/* Conversations List */}
            <ScrollView
              style={styles.conversationsList}
              contentContainerStyle={styles.conversationsListContent}
              showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#666" />
                  <Text style={styles.loadingText}>Loading conversations...</Text>
                </View>
              ) : ideas.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#999" />
                  <Text style={styles.emptyText}>
                    No conversations yet.{'\n'}Start a new conversation to get started.
                  </Text>
                </View>
              ) : (
                ideas.map((idea, index) => (
                  <TouchableOpacity
                    key={idea.id}
                    style={styles.conversationItem}
                    onPress={() => handleSelectIdea(idea)}
                    activeOpacity={0.7}>
                    <LiquidGlassView style={styles.conversationItemInner} interactive effect="clear">
                      <View style={styles.conversationContent}>
                        <View style={styles.conversationHeader}>
                          <View style={styles.conversationIcon}>
                            <Ionicons name="bulb-outline" size={20} color="#666" />
                          </View>
                          <View style={styles.conversationInfo}>
                            <Text style={styles.conversationTitle} numberOfLines={1}>
                              {idea.analysis?.summary
                                ? truncateText(idea.analysis.summary, 40)
                                : truncateText(idea.transcribed_text, 40)}
                            </Text>
                            <Text style={styles.conversationDate}>
                              {formatDate(idea.created_at)}
                            </Text>
                          </View>
                        </View>
                        {idea.transcribed_text && (
                          <Text style={styles.conversationPreview} numberOfLines={2}>
                            {truncateText(idea.transcribed_text, 80)}
                          </Text>
                        )}
                      </View>
                    </LiquidGlassView>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </LinearGradient>
        </Animated.View>

        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sidepanel: {
    width: 300,
    height: '100%',
    backgroundColor: '#fff',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    fontFamily: defaultFontFamily,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  closeButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  newConversationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  newConversationButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  newConversationGradient: {
    borderRadius: 20,
    padding: 2,
  },
  newConversationInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    gap: 8,
  },
  newConversationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    fontFamily: defaultFontFamily,
  },
  conversationsList: {
    flex: 1,
  },
  conversationsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontFamily: defaultFontFamily,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontFamily: defaultFontFamily,
    lineHeight: 20,
  },
  conversationItem: {
    marginBottom: 12,
  },
  conversationItemInner: {
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  conversationContent: {
    padding: 16,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conversationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    fontFamily: defaultFontFamily,
  },
  conversationDate: {
    fontSize: 12,
    color: '#666',
    fontFamily: defaultFontFamily,
  },
  conversationPreview: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    fontFamily: defaultFontFamily,
  },
});

