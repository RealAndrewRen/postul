import { LiquidGlassView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { defaultFontFamily } from '@/constants/theme';
import { SocialPlatform } from '@/app/project/[id]/survey-post';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PlatformSwitcherProps {
    selectedPlatform: SocialPlatform;
    onPlatformChange: (platform: SocialPlatform) => void;
}

export function PlatformSwitcher({ selectedPlatform, onPlatformChange }: PlatformSwitcherProps) {
    const xScale = useSharedValue(selectedPlatform === 'x' ? 1 : 0.95);
    const threadsScale = useSharedValue(selectedPlatform === 'threads' ? 1 : 0.95);

    const xAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: xScale.value }],
    }));

    const threadsAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: threadsScale.value }],
    }));

    const handleXPress = () => {
        if (selectedPlatform !== 'x') {
            xScale.value = withSpring(1);
            threadsScale.value = withSpring(0.95);
            onPlatformChange('x');
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    };

    const handleThreadsPress = () => {
        if (selectedPlatform !== 'threads') {
            threadsScale.value = withSpring(1);
            xScale.value = withSpring(0.95);
            onPlatformChange('threads');
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }
    };

    return (
        <View style={styles.container}>
            <LiquidGlassView style={styles.card} interactive effect="clear">
                <View style={styles.content}>
                    <Text style={styles.title}>Platform</Text>
                    <View style={styles.switcherContainer}>
                        <AnimatedPressable
                            style={[styles.platformButton, xAnimatedStyle]}
                            onPress={handleXPress}>
                            <LiquidGlassView
                                style={[
                                    styles.platformButtonInner,
                                    selectedPlatform === 'x' && styles.platformButtonSelected,
                                ]}
                                interactive
                                effect="clear">
                                <Ionicons
                                    name="logo-twitter"
                                    size={20}
                                    color={selectedPlatform === 'x' ? '#000' : '#fff'}
                                />
                                <Text
                                    style={[
                                        styles.platformButtonText,
                                        selectedPlatform === 'x' && styles.platformButtonTextSelected,
                                    ]}>
                                    X
                                </Text>
                            </LiquidGlassView>
                        </AnimatedPressable>

                        <AnimatedPressable
                            style={[styles.platformButton, threadsAnimatedStyle]}
                            onPress={handleThreadsPress}>
                            <LiquidGlassView
                                style={[
                                    styles.platformButtonInner,
                                    selectedPlatform === 'threads' && styles.platformButtonSelected,
                                ]}
                                interactive
                                effect="clear">
                                <Ionicons
                                    name="logo-instagram"
                                    size={20}
                                    color={selectedPlatform === 'threads' ? '#000' : '#fff'}
                                />
                                <Text
                                    style={[
                                        styles.platformButtonText,
                                        selectedPlatform === 'threads' && styles.platformButtonTextSelected,
                                    ]}>
                                    Threads
                                </Text>
                            </LiquidGlassView>
                        </AnimatedPressable>
                    </View>
                </View>
            </LiquidGlassView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    card: {
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#26262640',
        borderColor: 'rgba(255, 255, 255, 0.8)',
        borderWidth: 1,
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
    content: {
        padding: 24,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 16,
        fontFamily: defaultFontFamily,
    },
    switcherContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    platformButton: {
        flex: 1,
    },
    platformButtonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        gap: 8,
    },
    platformButtonSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    platformButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        fontFamily: defaultFontFamily,
    },
    platformButtonTextSelected: {
        color: '#000',
    },
});

