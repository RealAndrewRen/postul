import { LiquidGlassView } from '@callstack/liquid-glass';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { defaultFontFamily } from '@/constants/theme';
import { SocialPlatform } from '@/app/project/[id]/survey-post';

interface PostPreviewProps {
    text: string;
    platform: SocialPlatform;
}

export function PostPreview({ text, platform }: PostPreviewProps) {
    if (platform === 'x') {
        return <XPreview text={text} />;
    } else {
        return <ThreadsPreview text={text} />;
    }
}

function XPreview({ text }: { text: string }) {
    return (
        <View style={styles.container}>
            <LiquidGlassView style={styles.card} interactive effect="clear">
                <View style={styles.content}>
                    <Text style={styles.title}>Preview</Text>
                    <View style={styles.xPreview}>
                        {/* X/Twitter-like header */}
                        <View style={styles.xHeader}>
                            <View style={styles.xAvatar} />
                            <View style={styles.xHeaderInfo}>
                                <Text style={styles.xName}>Your Name</Text>
                                <Text style={styles.xHandle}>@yourhandle</Text>
                            </View>
                            <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                        </View>
                        {/* X/Twitter-like content */}
                        <View style={styles.xContent}>
                            <Text style={styles.xText}>{text}</Text>
                        </View>
                        {/* X/Twitter-like footer */}
                        <View style={styles.xFooter}>
                            <View style={styles.xFooterItem}>
                                <Ionicons name="chatbubble-outline" size={16} color="#666" />
                                <Text style={styles.xFooterText}>0</Text>
                            </View>
                            <View style={styles.xFooterItem}>
                                <Ionicons name="repeat-outline" size={16} color="#666" />
                                <Text style={styles.xFooterText}>0</Text>
                            </View>
                            <View style={styles.xFooterItem}>
                                <Ionicons name="heart-outline" size={16} color="#666" />
                                <Text style={styles.xFooterText}>0</Text>
                            </View>
                            <View style={styles.xFooterItem}>
                                <Ionicons name="share-outline" size={16} color="#666" />
                            </View>
                        </View>
                    </View>
                </View>
            </LiquidGlassView>
        </View>
    );
}

function ThreadsPreview({ text }: { text: string }) {
    return (
        <View style={styles.container}>
            <LiquidGlassView style={styles.card} interactive effect="clear">
                <View style={styles.content}>
                    <Text style={styles.title}>Preview</Text>
                    <View style={styles.threadsPreview}>
                        {/* Threads-like header */}
                        <View style={styles.threadsHeader}>
                            <View style={styles.threadsAvatar} />
                            <View style={styles.threadsHeaderInfo}>
                                <Text style={styles.threadsName}>yourhandle</Text>
                                <Text style={styles.threadsTime}>now</Text>
                            </View>
                            <Ionicons name="logo-instagram" size={20} color="#000" />
                        </View>
                        {/* Threads-like content */}
                        <View style={styles.threadsContent}>
                            <Text style={styles.threadsText}>{text}</Text>
                        </View>
                        {/* Threads-like footer */}
                        <View style={styles.threadsFooter}>
                            <Ionicons name="heart-outline" size={24} color="#000" />
                            <Ionicons name="chatbubble-outline" size={24} color="#000" />
                            <Ionicons name="repeat-outline" size={24} color="#000" />
                            <Ionicons name="send-outline" size={24} color="#000" />
                        </View>
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
    // X/Twitter styles
    xPreview: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    xHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    xAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1DA1F2',
        marginRight: 12,
    },
    xHeaderInfo: {
        flex: 1,
    },
    xName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#14171A',
        fontFamily: defaultFontFamily,
    },
    xHandle: {
        fontSize: 15,
        color: '#657786',
        fontFamily: defaultFontFamily,
    },
    xContent: {
        marginBottom: 12,
    },
    xText: {
        fontSize: 15,
        color: '#14171A',
        lineHeight: 20,
        fontFamily: defaultFontFamily,
    },
    xFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E1E8ED',
    },
    xFooterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    xFooterText: {
        fontSize: 13,
        color: '#657786',
        fontFamily: defaultFontFamily,
    },
    // Threads styles
    threadsPreview: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E1E8ED',
    },
    threadsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    threadsAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#000',
        marginRight: 12,
    },
    threadsHeaderInfo: {
        flex: 1,
    },
    threadsName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
        fontFamily: defaultFontFamily,
    },
    threadsTime: {
        fontSize: 12,
        color: '#666',
        fontFamily: defaultFontFamily,
    },
    threadsContent: {
        marginBottom: 12,
    },
    threadsText: {
        fontSize: 14,
        color: '#000',
        lineHeight: 20,
        fontFamily: defaultFontFamily,
    },
    threadsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#E1E8ED',
    },
});

