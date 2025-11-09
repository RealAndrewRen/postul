import { isLiquidGlassSupported, LiquidGlassView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { defaultFontFamily } from '@/constants/theme';
import { apiService, Project } from '@/services/api';

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const finalTranscriptRef = useRef<string>('');

  // Listen to speech recognition events
  useSpeechRecognitionEvent('start', () => {
    console.log('Speech recognition started');
  });

  useSpeechRecognitionEvent('audiostart', () => {
    console.log('Audio capture started');
  });

  useSpeechRecognitionEvent('result', (event) => {
    const { results, isFinal } = event as any;
    if (results && results.length > 0) {
      // Build complete transcript from all results
      // The results array contains all transcript parts so far
      const fullTranscript = results
        .map((result: any) => result.transcript)
        .join(' ')
        .trim();

      console.log('Speech recognition result:', {
        fullTranscript,
        isFinal,
        resultsCount: results.length,
        latestResult: results[results.length - 1],
      });

      // Update current transcript for display
      setCurrentTranscript(fullTranscript);

      // Store transcript (will be used when recording stops)
      // We update it on every result so we have the latest
      finalTranscriptRef.current = fullTranscript;

      if (isFinal) {
        console.log('=== FINAL TRANSCRIPTION DETECTED ===');
        console.log(fullTranscript);
        console.log('====================================');
      }
    }
  });

  useSpeechRecognitionEvent('audioend', () => {
    console.log('Audio capture ended');
  });

  useSpeechRecognitionEvent('end', async () => {
    console.log('Speech recognition ended');
    setIsRecording(false);

    // Get the final transcript (use current transcript if final transcript is empty)
    let transcript = finalTranscriptRef.current.trim();
    if (!transcript && currentTranscript) {
      transcript = currentTranscript.trim();
    }

    console.log('Final transcript to send:', transcript);

    // Send transcript to server for analysis if we have content
    if (transcript.length > 0) {
      await analyzeIdea(transcript);
    } else {
      console.log('No transcript to send');
    }

    // Clear transcript
    setCurrentTranscript('');
    finalTranscriptRef.current = '';
  });

  useSpeechRecognitionEvent('error', (event) => {
    console.error('Speech recognition error:', event.error);
    Alert.alert('Recognition Error', event.error || 'An error occurred during speech recognition.');
    setIsRecording(false);
  });

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Check if speech recognition is available
  useEffect(() => {
    (async () => {
      try {
        const available = ExpoSpeechRecognitionModule.isRecognitionAvailable();
        console.log('Speech recognition available:', available);

        if (!available) {
          Alert.alert(
            'Not Available',
            'Speech recognition is not available on this device.',
          );
        }
      } catch (error) {
        console.error('Error checking speech recognition availability:', error);
      }
    })();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const fetchedProjects = await apiService.getProjects();
      setProjects(fetchedProjects);
      console.log('Fetched projects:', fetchedProjects);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to fetch projects. Please check your connection.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeIdea = async (transcribedText: string) => {
    try {
      setIsAnalyzing(true);
      console.log('Analyzing idea:', transcribedText);

      const response = await apiService.analyzeIdea({
        transcribed_text: transcribedText,
      });

      console.log('Analysis response:', response);

      // Refresh projects list (in case the idea was associated with a project)
      await fetchProjects();

      // Show success message
      Alert.alert(
        'Success',
        'Your idea has been analyzed!',
      );
    } catch (error: any) {
      console.error('Error analyzing idea:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to analyze idea. Please try again.',
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleRecord = async () => {
    // Don't allow toggling while analyzing
    if (isAnalyzing) {
      return;
    }

    try {
      if (isRecording) {
        // Stop recognition
        // Haptic feedback for stop
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Clear transcripts before stopping
        // The 'end' event will handle sending the final transcript
        await ExpoSpeechRecognitionModule.stop();
        console.log('Stopped speech recognition');
      } else {
        // Start recognition
        // Haptic feedback for start
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        // Clear previous transcript
        setCurrentTranscript('');
        finalTranscriptRef.current = '';

        await ExpoSpeechRecognitionModule.start({
          lang: 'en-US',
          interimResults: true, // Get partial results as user speaks
          continuous: true, // Keep recording until manually stopped
        });

        setIsRecording(true);
        console.log('Started speech recognition');
      }
    } catch (error: any) {
      console.error('Error toggling speech recognition:', error);
      Alert.alert('Error', error.message || 'Something went wrong with speech recognition.');
      setIsRecording(false);
    }
  };

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
          <Pressable style={styles.iconButton}>
            <LiquidGlassView
              style={styles.iconButton}
              interactive
              effect="clear">
              <Ionicons name="arrow-back" size={24} color="#444" />
            </LiquidGlassView>
          </Pressable>
          <Pressable style={styles.iconButton}>
            <LiquidGlassView
              style={styles.iconButton}
              interactive
              effect="clear">
              <Ionicons name="settings" size={24} color="#444" />
            </LiquidGlassView>
          </Pressable>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Top Card */}
          <LiquidGlassView
            style={[
              styles.topCard,
              isRecording && styles.topCardGrayscaled
            ]}
            interactive
            effect="clear">
            <View style={styles.topCardContent}>
              <Text
                style={[
                  styles.topCardTitle,
                  isRecording && styles.grayscaledText
                ]}>
                What&apos;s on{'\n'}your mind?
              </Text>
              <Text
                style={[
                  styles.topCardSubtitle,
                  isRecording && styles.grayscaledText
                ]}>
                Great idea starts from{'\n'}just spitting it out
              </Text>
            </View>
          </LiquidGlassView>

          {/* Projects Card */}
          <LiquidGlassView
            style={[
              styles.projectsCard,
              (isRecording || isAnalyzing) && styles.projectsCardGrayscaled
            ]}
            interactive
            effect="clear">
            <ScrollView>
              {isLoading && projects.length === 0 ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.loadingText}>Loading projects...</Text>
                </View>
              ) : projects.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No projects yet.{'\n'}Your projects will appear here.
                  </Text>
                </View>
              ) : (
                projects.map((project, index) => (
                  <View key={project.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.projectItem}>
                      <View style={[
                        styles.avatarPlaceholder,
                        (isRecording || isAnalyzing) && styles.grayscaledAvatar
                      ]} />
                      <View style={styles.projectInfo}>
                        <Text
                          style={[
                            styles.projectTitle,
                            (isRecording || isAnalyzing) && styles.grayscaledText
                          ]}>
                          {project.name}
                        </Text>
                        <Text
                          style={[
                            styles.projectUser,
                            (isRecording || isAnalyzing) && styles.grayscaledText
                          ]}>
                          {new Date(project.created_at).toLocaleDateString()}
                        </Text>
                        {project.description && (
                          <Text
                            style={[
                              styles.projectDescription,
                              (isRecording || isAnalyzing) && styles.grayscaledText
                            ]}
                            numberOfLines={6}
                            ellipsizeMode="tail"
                          >
                            {project.description}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                ))
              )}
              {isAnalyzing && (
                <View style={styles.analyzingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.analyzingText}>Analyzing your idea...</Text>
                </View>
              )}
            </ScrollView>
          </LiquidGlassView>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavContainer}>
          {/* <BlurView intensity={50} tint="light" style={styles.bottomNav}> */}
          <LiquidGlassView
            style={[
              styles.bottomNav,
              !isLiquidGlassSupported && { backgroundColor: 'rgba(255,255,255,0.5)' },
            ]}
            interactive
            effect="clear">

            {/* Voice Record Button */}
            <Pressable
              onPress={handleToggleRecord}
              disabled={isAnalyzing}
              style={[
                styles.recordButtonContainer,
                isAnalyzing && styles.recordButtonDisabled
              ]}>
              {isRecording || isAnalyzing ? (
                <LiquidGlassView
                  style={styles.recordButtonBlur}
                  interactive
                  effect="clear">
                  <View style={styles.recordButtonInner}>
                    {isAnalyzing ? (
                      <ActivityIndicator size="large" color="#666" />
                    ) : (
                      <Ionicons name="mic" size={32} color="#666" />
                    )}
                  </View>
                </LiquidGlassView>
              ) : (
                <LinearGradient
                  colors={['#FF4444', '#0066FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0, 1]}
                  style={styles.recordButtonGradient}>
                  <LiquidGlassView
                    style={[
                      styles.recordButtonGradient,
                      !isLiquidGlassSupported && { backgroundColor: 'rgba(255,255,255,0.5)' },
                    ]}
                    interactive
                    effect="clear">
                  </LiquidGlassView>
                </LinearGradient>
              )}
            </Pressable>
          </LiquidGlassView>
          {/* </BlurView> */}
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 44 : 20,
    paddingBottom: 16,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  topCard: {
    paddingVertical: 20,
    borderRadius: 30,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  topCardGrayscaled: {
    opacity: 0.4,
  },
  topCardContent: {
    padding: 40,
    alignItems: 'center',
  },
  topCardTitle: {
    fontSize: 40,
    fontWeight: '100',
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
    fontFamily: defaultFontFamily,
    shadowColor: '#000',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 4,
  },
  topCardSubtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#AAA',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: defaultFontFamily,
    // backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 1,
    borderRadius: 10,
  },
  projectsCard: {
    borderRadius: 30,
    overflow: 'hidden',
    maxHeight: 400,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    backgroundColor: '#26262640',
    color: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  projectsCardGrayscaled: {
    opacity: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 24,
  },
  projectItem: {
    flexDirection: 'row',
    padding: 24,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(200, 200, 200, 0.4)',
    marginRight: 16,
  },
  grayscaledAvatar: {
    opacity: 0.6,
  },
  projectInfo: {
    flex: 1,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    fontFamily: defaultFontFamily,
  },
  projectUser: {
    fontSize: 14,
    fontWeight: '400',
    color: '#fff',
    marginBottom: 8,
    fontFamily: defaultFontFamily,
  },
  projectDescription: {
    fontSize: 14,
    fontWeight: '300',
    color: '#fff',
    lineHeight: 20,
    fontFamily: defaultFontFamily,
  },
  grayscaledText: {
    opacity: 0.6,
  },
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 15,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
    paddingVertical: 20,
    borderRadius: 50,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '70%',
  },
  recordButtonDisabled: {
    opacity: 0.6,
  },
  recordButtonBlur: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 36, // more blurry for larger button
      },
      android: {
        elevation: 12,
      },
    }),
  },
  recordButtonGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    ...Platform.select({
      ios: {
        shadowColor: '#F5F5F5',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 18,
      },
    }),
  },
  recordButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    fontFamily: defaultFontFamily,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: defaultFontFamily,
    opacity: 0.7,
  },
  analyzingContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzingText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: defaultFontFamily,
  },
  priorityBadge: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
  },
  priorityText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: defaultFontFamily,
    fontWeight: '500',
  },
});
