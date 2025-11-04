import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, StatusBar, Alert } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

import { GlassCard } from '@/components/glass-card';
import { defaultFontFamily } from '@/constants/theme';

// Sample project data
const SAMPLE_PROJECTS = [
  {
    id: 1,
    title: 'Project Example',
    user: 'User 1',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
  },
  {
    id: 2,
    title: 'Project Example',
    user: 'User 2',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
  },
  {
    id: 3,
    title: 'Project Example',
    user: 'User 3',
    description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
  },
];

export default function HomeScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    // Request audio permissions on mount
    (async () => {
      try {
        const permissionResponse = await Audio.requestPermissionsAsync();
        if (permissionResponse.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant microphone permission to use voice recording.',
          );
        }
      } catch (error) {
        console.error('Error requesting audio permissions:', error);
      }
    })();

    // Cleanup on unmount
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  const handleToggleRecord = async () => {
    try {
      if (isRecording) {
        // Stop recording
        if (recordingRef.current) {
          // Haptic feedback for stop
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          
          await recordingRef.current.stopAndUnloadAsync();
          const uri = recordingRef.current.getURI();
          console.log('Recording saved to:', uri);
          recordingRef.current = null;
          setIsRecording(false);
        }
      } else {
        // Start recording
        try {
          // Haptic feedback for start
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });

          const { recording: newRecording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY,
          );
          
          recordingRef.current = newRecording;
          setIsRecording(true);
          
          // Listen for recording status updates
          newRecording.setOnRecordingStatusUpdate((status) => {
            if (status.isDoneRecording) {
              setIsRecording(false);
            }
          });
        } catch (error) {
          console.error('Error starting recording:', error);
          Alert.alert('Recording Error', 'Failed to start recording. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      Alert.alert('Error', 'Something went wrong with the recording.');
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
            <Ionicons name="arrow-back" size={24} color="#444" />
          </Pressable>
          <Pressable style={styles.iconButton}>
            <Ionicons name="settings" size={24} color="#444" />
          </Pressable>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Top Card */}
          <GlassCard
            style={[
              styles.topCard,
              isRecording && styles.topCardGrayscaled
            ]}
            intensity={20}
            tint="light">
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
                Great idea starts from{'\n'}spitting out
              </Text>
            </View>
          </GlassCard>

          {/* Projects Card */}
          <GlassCard
            style={[
              styles.projectsCard,
              isRecording && styles.projectsCardGrayscaled
            ]}
            intensity={20}
            tint="light">
            <ScrollView>
              {SAMPLE_PROJECTS.map((project, index) => (
                <View key={project.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.projectItem}>
                    <View style={[
                      styles.avatarPlaceholder,
                      isRecording && styles.grayscaledAvatar
                    ]} />
                    <View style={styles.projectInfo}>
                      <Text
                        style={[
                          styles.projectTitle,
                          isRecording && styles.grayscaledText
                        ]}>
                        {project.title}
                      </Text>
                      <Text
                        style={[
                          styles.projectUser,
                          isRecording && styles.grayscaledText
                        ]}>
                        {project.user}
                      </Text>
                      <Text
                        style={[
                          styles.projectDescription,
                          isRecording && styles.grayscaledText
                        ]}>
                        {project.description}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </GlassCard>
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNavContainer}>
          <BlurView intensity={50} tint="light" style={styles.bottomNav}>
            {/* Voice Record Button */}
            <Pressable
              onPress={handleToggleRecord}
              style={styles.recordButtonContainer}>
              {isRecording ? (
                <BlurView intensity={70} tint="light" style={styles.recordButtonBlur}>
                  <View style={styles.recordButtonInner}>
                    {/* <Ionicons name="mic" size={32} color="#666" /> */}
                  </View>
                </BlurView>
              ) : (
                <LinearGradient
                  colors={['#FF4444', '#0066FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  locations={[0, 1]}
                  style={styles.recordButtonGradient}>
                  <View style={styles.recordButtonInner}>
                    {/* <Ionicons name="mic" size={32} color="#FFF" /> */}
                  </View>
                </LinearGradient>
              )}
            </Pressable>
          </BlurView>
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
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
    borderRadius: 30,
    marginBottom: 16,
    overflow: 'hidden',
    maxHeight: 200,
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
    fontSize: 38,
    fontWeight: '200',
    color: '#999',
    textAlign: 'center',
    marginBottom: 12,
    fontStyle: 'italic',
    letterSpacing: 0.5,
    fontFamily: defaultFontFamily,
  },
  topCardSubtitle: {
    fontSize: 16,
    fontWeight: '300',
    color: '#AAA',
    textAlign: 'center',
    letterSpacing: 0.3,
    fontFamily: defaultFontFamily,
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
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255)',
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
  recordButtonBlur: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 28, // more blurry
      },
      android: {
        elevation: 8,
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
});
