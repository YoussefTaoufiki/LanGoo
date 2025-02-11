import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    FlatList,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useCustomTheme } from '../hooks/useCustomTheme';
import {
    fetchVocabulary,
    setFilter,
    selectItem,
    playWordAudio,
    updateMasteryScore,
    toggleFavorite,
    deleteVocabularyItem,
    exportVocabulary,
    resetPagination,
    fetchMoreVocabulary,
} from '../store/slices/vocabularySlice';
import { VocabularyItem, VocabularyFilter } from '../services/vocabularyService';
import { formatTime } from '../utils/timeUtils';
import { Button } from './Button';

type AppDispatch = ThunkDispatch<RootState, undefined, AnyAction>;

const VocabularyManager: React.FC = () => {
    const theme = useCustomTheme();
    const dispatch = useDispatch<AppDispatch>();
    const { 
        items, 
        loading, 
        loadingMore,
        error, 
        selectedItem,
        hasMore 
    } = useSelector((state: RootState) => state.vocabulary);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentFilter, setCurrentFilter] = useState<VocabularyFilter>({});

    useEffect(() => {
        dispatch(resetPagination());
        dispatch(fetchVocabulary(currentFilter));
    }, [dispatch, currentFilter]);

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            dispatch(fetchMoreVocabulary(currentFilter));
        }
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        dispatch(resetPagination());
        setCurrentFilter({ ...currentFilter, searchTerm: text });
    };

    const handleFilterChange = (filterType: string, value: any) => {
        const newFilter = { ...currentFilter, [filterType]: value };
        setCurrentFilter(newFilter);
        dispatch(setFilter(newFilter));
    };

    const handlePlayAudio = async (word: string, language: string) => {
        try {
            await dispatch(playWordAudio({ word, language }));
        } catch (error) {
            Alert.alert('Error', 'Failed to play audio');
        }
    };

    const handleToggleFavorite = async (id: string) => {
        try {
            await dispatch(toggleFavorite(id));
        } catch (error) {
            Alert.alert('Error', 'Failed to toggle favorite status');
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this vocabulary item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(deleteVocabularyItem(id));
                        } catch (error) {
                            Alert.alert('Error', 'Failed to delete item');
                        }
                    },
                },
            ]
        );
    };

    const handleExport = async (format: 'csv' | 'json') => {
        try {
            await dispatch(exportVocabulary(format));
            Alert.alert('Success', `Vocabulary exported as ${format.toUpperCase()}`);
        } catch (error) {
            Alert.alert('Error', 'Failed to export vocabulary');
        }
    };

    const renderVocabularyItem = ({ item }: { item: VocabularyItem }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
            onPress={() => dispatch(selectItem(item))}
        >
            <View style={styles.cardHeader}>
                <View style={styles.wordContainer}>
                    <Text style={[styles.word, { color: theme.colors.primary }]}>{item.word}</Text>
                    <Text style={styles.phonetic}>{item.phonetic}</Text>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handlePlayAudio(item.word, item.language)}>
                        <Icon name="volume-high" size={24} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleToggleFavorite(item.id)}>
                        <Icon
                            name={item.isFavorite ? 'star' : 'star-outline'}
                            size={24}
                            color={item.isFavorite ? theme.colors.primary : theme.colors.onSurface}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            
            <Text style={styles.translation}>{item.translation}</Text>
            
            {item.examples.length > 0 && (
                <View style={styles.examples}>
                    <Text style={styles.exampleLabel}>Examples:</Text>
                    {item.examples.map((example, index) => (
                        <Text key={index} style={styles.example}>{example}</Text>
                    ))}
                </View>
            )}
            
            <View style={styles.footer}>
                <View style={styles.tags}>
                    {item.tags.map((tag, index) => (
                        <View key={index} style={[styles.tag, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Text style={[styles.tagText, { color: theme.colors.primary }]}>{tag}</Text>
                        </View>
                    ))}
                </View>
                
                <View style={styles.stats}>
                    <Text style={styles.statText}>Mastery: {item.masteryScore}%</Text>
                    <Text style={styles.statText}>Practiced: {item.practiceCount} times</Text>
                    <Text style={styles.statText}>Last: {formatTime(item.lastPracticed)}</Text>
                </View>
                
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Icon name="delete" size={20} color={theme.colors.error} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={styles.loaderFooter}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.primary }]}>My Vocabulary</Text>
                <View style={styles.searchBar}>
                    <Icon name="magnify" size={24} color={theme.colors.onSurface} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search vocabulary..."
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                </View>
            </View>

            <View style={styles.filters}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            currentFilter.favorite && { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={() => handleFilterChange('favorite', !currentFilter.favorite)}
                    >
                        <Icon
                            name="star"
                            size={20}
                            color={currentFilter.favorite ? theme.colors.surface : theme.colors.primary}
                        />
                        <Text
                            style={[
                                styles.filterText,
                                currentFilter.favorite && { color: theme.colors.surface },
                            ]}
                        >
                            Favorites
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            currentFilter.needsPractice && { backgroundColor: theme.colors.primary },
                        ]}
                        onPress={() => handleFilterChange('needsPractice', !currentFilter.needsPractice)}
                    >
                        <Icon
                            name="school"
                            size={20}
                            color={currentFilter.needsPractice ? theme.colors.surface : theme.colors.primary}
                        />
                        <Text
                            style={[
                                styles.filterText,
                                currentFilter.needsPractice && { color: theme.colors.surface },
                            ]}
                        >
                            Needs Practice
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {loading && !loadingMore ? (
                <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : error ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
            ) : (
                <FlatList
                    data={items}
                    renderItem={renderVocabularyItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                />
            )}

            <View style={styles.exportButtons}>
                <Button
                    title="Export as CSV"
                    onPress={() => handleExport('csv')}
                    variant="secondary"
                    style={styles.exportButton}
                />
                <Button
                    title="Export as JSON"
                    onPress={() => handleExport('json')}
                    variant="secondary"
                    style={styles.exportButton}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 8,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    filters: {
        marginBottom: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    filterText: {
        marginLeft: 4,
        fontSize: 14,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    wordContainer: {
        flex: 1,
    },
    word: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    phonetic: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    translation: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    examples: {
        marginBottom: 12,
    },
    exampleLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 4,
    },
    example: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
    },
    tag: {
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    tagText: {
        fontSize: 12,
    },
    stats: {
        alignItems: 'flex-end',
    },
    statText: {
        fontSize: 12,
        color: '#666',
    },
    deleteButton: {
        padding: 8,
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    error: {
        textAlign: 'center',
        marginTop: 16,
    },
    list: {
        paddingBottom: 16,
    },
    exportButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    exportButton: {
        flex: 1,
        marginHorizontal: 8,
    },
    loaderFooter: {
        paddingVertical: 16,
        alignItems: 'center',
    },
});

export default VocabularyManager;
