import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';

import {Region, useRegionsStore} from '../../store/regions/useRegionsStore';
import Feather from 'react-native-vector-icons/Feather';
import {FONT_FAMILY} from '../../assets/constants/fonts';

const RegionSelector = ({onSelect}: {onSelect: (region: Region) => void}) => {
  const {
    regions,
    selectedRegion,
    isLoading,
    error,
    fetchRegions,
    selectRegion,
  } = useRegionsStore();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchRegions();

      // If there's a selected region from the store, call onSelect
      if (selectedRegion) {
        onSelect(selectedRegion);
      }
    };

    loadInitialData();
  }, [fetchRegions, onSelect, selectedRegion]);

  const filteredRegions = regions.filter(
    region =>
      region.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.regionName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (region: Region) => {
    selectRegion(region); // Update the store
    onSelect(region); // Call the prop callback
    setIsOpen(false);
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading Regions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'red'}}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => {
          setIsOpen(true);
        }}>
        <View style={styles.buttonContent}>
          {selectedRegion ? (
            <>
              <Feather name="map-pin" color="#003F66" size={24} />
              <Text style={styles.selectedRegionText}>
                {selectedRegion.displayName}
              </Text>
            </>
          ) : (
            <>
              <Feather name="map-pin" color="#003F66" size={24} />
              <Text style={styles.selectedRegionText}>Select Region</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.dropdownContainer}>
          <View style={styles.dropdown}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search Regions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />

            <FlatList
              data={filteredRegions}
              keyExtractor={item => item.regionId}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.regionItem}
                  onPress={() => handleSelect(item)}>
                  <Text style={styles.regionDisplayName}>
                    {item.displayName}
                  </Text>
                  <Text style={styles.regionName}>{item.regionName}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              indicatorStyle="black"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '70%',
    zIndex: 1,
  },
  selectorButton: {
    paddingTop: 16,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  locationIcon: {
    marginRight: 8,
  },
  selectedRegionText: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    color: '#003F66',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#888',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: windowHeight * 0.1,
  },
  dropdown: {
    width: '90%',
    maxHeight: windowHeight * 0.6,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchInput: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 16,
  },
  regionItem: {
    padding: 12,
  },
  regionDisplayName: {
    fontSize: 16,
    fontFamily: FONT_FAMILY.outfitBold,
    marginBottom: 4,
  },
  regionName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});

export default RegionSelector;
