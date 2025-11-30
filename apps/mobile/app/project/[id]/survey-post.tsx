import { LiquidGlassView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import Animated, {
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { defaultFontFamily } from '@/constants/theme';
import { apiService, Idea, Project, SurveyPostMessage as ApiSurveyPostMessage } from '@/services/api';
import { PlatformSwitcher } from '@/components/survey-post/platform-switcher';
import { PostMessageList } from '@/components/survey-post/post-message-list';
import { PostPreview } from '@/components/survey-post/post-preview';
import { EditablePostInput } from '@/components/survey-post/editable-post-input';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SocialPlatform = 'x' | 'threads';

export interface SurveyPostMessage extends ApiSurveyPostMessage {
    isCustom?: boolean;
}

export default function SurveyPostScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [idea, setIdea] = useState<Idea | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('x');
    const [postMessages, setPostMessages] = useState<SurveyPostMessage[]>([]);
    const [selectedMessageIndex, setSelectedMessageIndex] = useState<number>(0);
    const [editingText, setEditingText] = useState<string>('');

    const loadProjectData = useCallback(async () => {
        if (!id) return;

        try {
            setIsLoading(true);
            const projectId = parseInt(id, 10);
            const [projectData, ideasData] = await Promise.all([
                apiService.getProject(projectId),
                apiService.getIdeas(projectId),
            ]);

            setProject(projectData);
            if (ideasData && ideasData.length > 0) {
                setIdea(ideasData[0]);
            }
        } catch (error: any) {
            console.error('Error loading project data:', error);
            Alert.alert('Error', error.message || 'Failed to load project data.');
        } finally {
            setIsLoading(false);
        }
    }, [id]);

    const generatePostMessages = useCallback(async () => {
        if (!idea) return;

        try {
            setIsGenerating(true);
            
            // Try to use API endpoint, fallback to mock if not available
            try {
                const response = await apiService.generateSurveyPosts({
                    idea_id: idea.id,
                    platform: selectedPlatform,
                    count: 3,
                });
                
                if (response.messages && response.messages.length > 0) {
                    setPostMessages(response.messages);
                    setSelectedMessageIndex(0);
                    setEditingText(response.messages[0].text);
                    return;
                }
            } catch (apiError: any) {
                // If API endpoint doesn't exist yet, use mock data
                console.log('API endpoint not available, using mock data:', apiError.message);
            }
            
            // Fallback to mock messages based on idea analysis
            const mockMessages: SurveyPostMessage[] = [
                {
                    id: '1',
                    text: `What do you think about ${idea.analysis?.summary?.substring(0, 50) || idea.transcribed_text.substring(0, 50)}...? Would love your thoughts! 🚀`,
                },
                {
                    id: '2',
                    text: `I'm exploring ${idea.analysis?.problem_statement?.substring(0, 60) || idea.transcribed_text.substring(0, 60)}... What's your take?`,
                },
                {
                    id: '3',
                    text: `Quick poll: ${idea.transcribed_text.substring(0, 100)}... Thoughts?`,
                },
            ];

            setPostMessages(mockMessages);
            setSelectedMessageIndex(0);
            setEditingText(mockMessages[0].text);
        } catch (error: any) {
            console.error('Error generating post messages:', error);
            Alert.alert('Error', error.message || 'Failed to generate post messages.');
        } finally {
            setIsGenerating(false);
        }
    }, [idea, selectedPlatform]);

    useEffect(() => {
        loadProjectData();
    }, [loadProjectData]);

    useEffect(() => {
        if (idea && postMessages.length === 0) {
            generatePostMessages();
        }
    }, [idea, generatePostMessages, postMessages.length]);

    const handleMessageSelect = (index: number) => {
        setSelectedMessageIndex(index);
        setEditingText(postMessages[index].text);
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleTextChange = (text: string) => {
        setEditingText(text);
        // Update the selected message
        const updatedMessages = [...postMessages];
        updatedMessages[selectedMessageIndex] = {
            ...updatedMessages[selectedMessageIndex],
            text,
        };
        setPostMessages(updatedMessages);
    };

    const handleAddCustomPost = () => {
        const newMessage: SurveyPostMessage = {
            id: `custom-${Date.now()}`,
            text: '',
            isCustom: true,
        };
        setPostMessages([...postMessages, newMessage]);
        setSelectedMessageIndex(postMessages.length);
        setEditingText('');
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handlePost = async () => {
        const currentText = editingText.trim();
        if (!currentText) {
            Alert.alert('Error', 'Please enter a post message.');
            return;
        }

        try {
            // Open the appropriate social media app
            const platformUrl = selectedPlatform === 'x' 
                ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(currentText)}`
                : `https://threads.net/intent/post?text=${encodeURIComponent(currentText)}`;
            
            const canOpen = await Linking.canOpenURL(platformUrl);
            
            if (canOpen) {
                await Linking.openURL(platformUrl);
                
                if (Platform.OS === 'ios') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                
                // Navigate back after a short delay
                setTimeout(() => {
                    router.back();
                }, 500);
            } else {
                Alert.alert(
                    'Cannot Open',
                    `Please install ${selectedPlatform === 'x' ? 'X (Twitter)' : 'Threads'} app to continue.`,
                    [{ text: 'OK' }]
                );
            }
        } catch (error) {
            console.error('Error opening social media app:', error);
            Alert.alert('Error', 'Failed to open social media app.');
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
                <LinearGradient
                    colors={['#E0D9E8', '#F2C5D6', '#F6D3B5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradient}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#666" />
                        <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    if (!project || !idea) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
                <LinearGradient
                    colors={['#E0D9E8', '#F2C5D6', '#F6D3B5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.gradient}>
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>Project or idea not found</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
            <LinearGradient
                colors={['#E0D9E8', '#F2C5D6', '#F6D3B5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.gradient}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable
                        style={styles.iconButton}
                        onPress={() => {
                            if (Platform.OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            router.back();
                        }}>
                        <LiquidGlassView style={styles.iconButton} interactive effect="clear">
                            <Ionicons name="arrow-back" size={24} color="#444" />
                        </LiquidGlassView>
                    </Pressable>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle}>Survey Post</Text>
                    </View>
                    <View style={styles.iconButton} />
                </View>

                {/* Main Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}>
                    {isGenerating ? (
                        <View style={styles.generatingContainer}>
                            <ActivityIndicator size="large" color="#fff" />
                            <Text style={styles.generatingText}>Generating post messages...</Text>
                        </View>
                    ) : (
                        <>
                            {/* Platform Switcher */}
                            <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
                                <PlatformSwitcher
                                    selectedPlatform={selectedPlatform}
                                    onPlatformChange={(platform) => {
                                        setSelectedPlatform(platform);
                                        // Regenerate messages when platform changes
                                        if (idea && postMessages.length > 0) {
                                            generatePostMessages();
                                        }
                                    }}
                                />
                            </Animated.View>

                            {/* Post Message List */}
                            {postMessages.length > 0 && (
                                <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
                                    <PostMessageList
                                        messages={postMessages}
                                        selectedIndex={selectedMessageIndex}
                                        onSelect={handleMessageSelect}
                                        onAddCustom={handleAddCustomPost}
                                    />
                                </Animated.View>
                            )}

                            {/* Editable Post Input */}
                            {postMessages.length > 0 && (
                                <Animated.View entering={FadeInDown.delay(300).duration(400).springify()}>
                                    <EditablePostInput
                                        text={editingText}
                                        onChangeText={handleTextChange}
                                        platform={selectedPlatform}
                                    />
                                </Animated.View>
                            )}

                            {/* Preview */}
                            {postMessages.length > 0 && editingText.trim() && (
                                <Animated.View entering={FadeInDown.delay(400).duration(400).springify()}>
                                    <PostPreview
                                        text={editingText}
                                        platform={selectedPlatform}
                                    />
                                </Animated.View>
                            )}
                        </>
                    )}
                </ScrollView>

                {/* Post Button */}
                {postMessages.length > 0 && editingText.trim() && !isGenerating && (
                    <View style={styles.postButtonContainer}>
                        <Pressable
                            style={styles.postButton}
                            onPress={handlePost}>
                            <LinearGradient
                                colors={['#FF6B9D', '#C44569', '#A8E6CF']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.postButtonGradient}>
                                <LiquidGlassView style={styles.postButtonInner} interactive effect="clear">
                                    <Ionicons name="send" size={20} color="#000" />
                                    <Text style={styles.postButtonText}>Post</Text>
                                </LiquidGlassView>
                            </LinearGradient>
                        </Pressable>
                    </View>
                )}
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E0D9E8',
    },
    gradient: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
        fontFamily: defaultFontFamily,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        fontFamily: defaultFontFamily,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 20,
        paddingBottom: 16,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        fontFamily: defaultFontFamily,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    generatingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    generatingText: {
        marginTop: 16,
        fontSize: 14,
        color: '#fff',
        fontFamily: defaultFontFamily,
    },
    postButtonContainer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        paddingTop: 12,
    },
    postButton: {
        borderRadius: 20,
    },
    postButtonGradient: {
        borderRadius: 20,
        padding: 2,
    },
    postButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        gap: 8,
    },
    postButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        fontFamily: defaultFontFamily,
    },
});

