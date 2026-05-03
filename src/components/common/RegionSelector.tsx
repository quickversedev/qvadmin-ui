import React, {useState} from 'react';
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
import Feather from 'react-native-vector-icons/Feather';
import {FONT_FAMILY} from '../../assets/constants/fonts';
import {useGetRegionsQuery} from '../../apis/authentication';
import {useRegionsStore} from '../../store/regions/useRegionsStore';

export interface Region {
  regionId: string;
  regionName: string;
  displayName: string;
  regionEnabled: boolean;
}

const RegionSelector = () => {
  const {data: regions, error, isLoading} = useGetRegionsQuery({});
  const {selectedRegion, selectRegion} = useRegionsStore(state => state);

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRegions = regions?.filter(
    (region: Region) =>
      region?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region?.regionName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (region: Region) => {
    selectRegion(region);
    setIsOpen(false);
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.selectedRegionText}>Loading Regions...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={{color: 'red', fontFamily: FONT_FAMILY.bricolageRegular}}>
          Error
        </Text>
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
              <Feather name="map-pin" color="#fff" size={16} />
              <Text style={styles.selectedRegionText}>
                {selectedRegion.displayName}
              </Text>
            </>
          ) : (
            <>
              <Feather name="map-pin" color="#fff" size={16} />
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
              placeholderTextColor={'#000'}
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
    zIndex: 1,
  },
  selectorButton: {},
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIcon: {
    marginRight: 8,
    color: '#FFF',
  },
  selectedRegionText: {
    fontSize: 14,
    fontFamily: FONT_FAMILY.bricolageMedium,
    color: '#FFF',
    marginLeft: 2,
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
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    fontSize: 18,
    fontFamily: FONT_FAMILY.outfitRegular,
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
    fontFamily: FONT_FAMILY.outfitRegular,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});

export default RegionSelector;
