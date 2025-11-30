import { LiquidGlassView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

import { defaultFontFamily } from '@/constants/theme';
import { SurveyPostMessage } from '@/app/project/[id]/survey-post';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface PostMessageListProps {
    messages: SurveyPostMessage[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    onAddCustom: () => void;
}

export function PostMessageList({
    messages,
    selectedIndex,
    onSelect,
    onAddCustom,
}: PostMessageListProps) {
    return (
        <View style={styles.container}>
            <LiquidGlassView style={styles.card} interactive effect="clear">
                <View style={styles.content}>
                    <Text style={styles.title}>Candidate Posts</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}>
                        {messages.map((message, index) => (
                            <PostMessageItem
                                key={message.id}
                                message={message}
                                isSelected={index === selectedIndex}
                                onPress={() => onSelect(index)}
                            />
                        ))}
                        <AddCustomButton onPress={onAddCustom} />
                    </ScrollView>
                </View>
            </LiquidGlassView>
        </View>
    );
}

interface PostMessageItemProps {
    message: SurveyPostMessage;
    isSelected: boolean;
    onPress: () => void;
}

function PostMessageItem({ message, isSelected, onPress }: PostMessageItemProps) {
    const scale = useSharedValue(isSelected ? 1 : 0.95);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.9);
    };

    const handlePressOut = () => {
        scale.value = withSpring(isSelected ? 1 : 0.95);
    };

    return (
        <AnimatedPressable
            style={[styles.messageItem, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}>
            <LiquidGlassView
                style={[
                    styles.messageItemInner,
                    isSelected && styles.messageItemSelected,
                ]}
                interactive
                effect="clear">
                {message.isCustom && (
                    <Ionicons name="add-circle" size={16} color={isSelected ? '#000' : '#fff'} />
                )}
                <Text
                    style={[
                        styles.messageItemText,
                        isSelected && styles.messageItemTextSelected,
                    ]}
                    numberOfLines={2}>
                    {message.text || 'New post...'}
                </Text>
            </LiquidGlassView>
        </AnimatedPressable>
    );
}

interface AddCustomButtonProps {
    onPress: () => void;
}

function AddCustomButton({ onPress }: AddCustomButtonProps) {
    const scale = useSharedValue(0.95);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.9);
    };

    const handlePressOut = () => {
        scale.value = withSpring(0.95);
    };

    return (
        <AnimatedPressable
            style={[styles.addButton, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={onPress}>
            <LiquidGlassView style={styles.addButtonInner} interactive effect="clear">
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add</Text>
            </LiquidGlassView>
        </AnimatedPressable>
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
    scrollContent: {
        gap: 12,
        paddingRight: 4,
    },
    messageItem: {
        width: 140,
    },
    messageItemInner: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        minHeight: 80,
        justifyContent: 'center',
        gap: 8,
    },
    messageItemSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    messageItemText: {
        fontSize: 12,
        color: '#fff',
        fontFamily: defaultFontFamily,
    },
    messageItemTextSelected: {
        color: '#000',
    },
    addButton: {
        width: 80,
        justifyContent: 'center',
    },
    addButtonInner: {
        padding: 12,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
        gap: 4,
    },
    addButtonText: {
        fontSize: 12,
        color: '#fff',
        fontFamily: defaultFontFamily,
    },
});

