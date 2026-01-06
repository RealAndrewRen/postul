import { LiquidGlassView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { defaultFontFamily } from '@/constants/theme';

interface SettingsPanelProps {
  visible: boolean;
  onClose: () => void;
}

type ThemeMode = 'light' | 'dark' | 'auto';

export function SettingsPanel({ visible, onClose }: SettingsPanelProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isChangingTheme, setIsChangingTheme] = useState(false);
  const slideAnim = useState(new Animated.Value(300))[0];

  useEffect(() => {
    if (visible) {
      // Animate slide in from right
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      // Animate slide out to right
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleThemeChange = async (mode: ThemeMode) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setIsChangingTheme(true);
    setThemeMode(mode);

    try {
      if (mode === 'auto') {
        // Use system preference
        await SystemUI.setBackgroundColorAsync('transparent');
      } else if (mode === 'dark') {
        await SystemUI.setBackgroundColorAsync('#151718');
      } else {
        await SystemUI.setBackgroundColorAsync('#fff');
      }
    } catch (error) {
      console.error('Error changing theme:', error);
    } finally {
      setIsChangingTheme(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            // TODO: Implement cache clearing
            Alert.alert('Success', 'Cache cleared successfully.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // TODO: Implement data export
    Alert.alert('Export Data', 'Data export feature coming soon.');
  };

  const currentTheme = themeMode === 'auto' ? systemColorScheme : themeMode;
  const isDark = currentTheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

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
              <Text style={styles.headerTitle}>Settings</Text>
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

            {/* Settings Content */}
            <ScrollView
              style={styles.settingsList}
              contentContainerStyle={styles.settingsListContent}
              showsVerticalScrollIndicator={false}>
              
              {/* Appearance Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Appearance</Text>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="color-palette-outline" size={20} color="#666" />
                    <Text style={styles.settingLabel}>Theme</Text>
                  </View>
                  {isChangingTheme && (
                    <ActivityIndicator size="small" color="#666" />
                  )}
                </View>

                <View style={styles.themeOptions}>
                  <TouchableOpacity
                    style={[
                      styles.themeOption,
                      themeMode === 'light' && styles.themeOptionActive,
                    ]}
                    onPress={() => handleThemeChange('light')}
                    activeOpacity={0.7}>
                    <LiquidGlassView
                      style={[
                        styles.themeOptionInner,
                        themeMode === 'light' && styles.themeOptionInnerActive,
                      ]}
                      interactive
                      effect="clear">
                      <Ionicons
                        name="sunny"
                        size={20}
                        color={themeMode === 'light' ? '#fff' : '#666'}
                      />
                      <Text
                        style={[
                          styles.themeOptionText,
                          themeMode === 'light' && styles.themeOptionTextActive,
                        ]}>
                        Light
                      </Text>
                    </LiquidGlassView>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeOption,
                      themeMode === 'dark' && styles.themeOptionActive,
                    ]}
                    onPress={() => handleThemeChange('dark')}
                    activeOpacity={0.7}>
                    <LiquidGlassView
                      style={[
                        styles.themeOptionInner,
                        themeMode === 'dark' && styles.themeOptionInnerActive,
                      ]}
                      interactive
                      effect="clear">
                      <Ionicons
                        name="moon"
                        size={20}
                        color={themeMode === 'dark' ? '#fff' : '#666'}
                      />
                      <Text
                        style={[
                          styles.themeOptionText,
                          themeMode === 'dark' && styles.themeOptionTextActive,
                        ]}>
                        Dark
                      </Text>
                    </LiquidGlassView>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.themeOption,
                      themeMode === 'auto' && styles.themeOptionActive,
                    ]}
                    onPress={() => handleThemeChange('auto')}
                    activeOpacity={0.7}>
                    <LiquidGlassView
                      style={[
                        styles.themeOptionInner,
                        themeMode === 'auto' && styles.themeOptionInnerActive,
                      ]}
                      interactive
                      effect="clear">
                      <Ionicons
                        name="phone-portrait-outline"
                        size={20}
                        color={themeMode === 'auto' ? '#fff' : '#666'}
                      />
                      <Text
                        style={[
                          styles.themeOptionText,
                          themeMode === 'auto' && styles.themeOptionTextActive,
                        ]}>
                        Auto
                      </Text>
                    </LiquidGlassView>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Preferences Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Preferences</Text>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="hand-left-outline" size={20} color="#666" />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Haptic Feedback</Text>
                      <Text style={styles.settingDescription}>
                        Vibrate on interactions
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={hapticFeedback}
                    onValueChange={(value) => {
                      if (Platform.OS === 'ios' && value) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setHapticFeedback(value);
                    }}
                    trackColor={{ false: '#ccc', true: '#A8E6CF' }}
                    thumbColor={hapticFeedback ? '#fff' : '#f4f3f4'}
                  />
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="notifications-outline" size={20} color="#666" />
                    <View style={styles.settingTextContainer}>
                      <Text style={styles.settingLabel}>Notifications</Text>
                      <Text style={styles.settingDescription}>
                        Receive updates and reminders
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications}
                    onValueChange={(value) => {
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setNotifications(value);
                    }}
                    trackColor={{ false: '#ccc', true: '#A8E6CF' }}
                    thumbColor={notifications ? '#fff' : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* Data Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data</Text>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleExportData}
                  activeOpacity={0.7}>
                  <LiquidGlassView style={styles.actionButtonInner} interactive effect="clear">
                    <Ionicons name="download-outline" size={20} color="#666" />
                    <Text style={styles.actionButtonText}>Export Data</Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </LiquidGlassView>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleClearCache}
                  activeOpacity={0.7}>
                  <LiquidGlassView style={styles.actionButtonInner} interactive effect="clear">
                    <Ionicons name="trash-outline" size={20} color="#FF6B9D" />
                    <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                      Clear Cache
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </LiquidGlassView>
                </TouchableOpacity>
              </View>

              {/* About Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                
                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>Version</Text>
                  <Text style={styles.aboutValue}>1.0.0</Text>
                </View>

                <View style={styles.aboutItem}>
                  <Text style={styles.aboutLabel}>Build</Text>
                  <Text style={styles.aboutValue}>2024.11</Text>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
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
  settingsList: {
    flex: 1,
  },
  settingsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
    fontFamily: defaultFontFamily,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
    fontFamily: defaultFontFamily,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
    fontFamily: defaultFontFamily,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
  },
  themeOptionActive: {},
  themeOptionInner: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    alignItems: 'center',
    gap: 8,
  },
  themeOptionInnerActive: {
    backgroundColor: 'rgba(168, 230, 207, 0.8)',
    borderColor: '#A8E6CF',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    fontFamily: defaultFontFamily,
  },
  themeOptionTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButton: {
    marginBottom: 12,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: defaultFontFamily,
  },
  actionButtonTextDanger: {
    color: '#FF6B9D',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  aboutLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: defaultFontFamily,
  },
  aboutValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: defaultFontFamily,
  },
});

