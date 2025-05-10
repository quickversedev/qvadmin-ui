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
import {Campus} from '../../store/campuses/useCampusesStore';
import {useCampuses} from '../../hooks/campuses/useCampuses';
import Feather from 'react-native-vector-icons/Feather';

const CampusSelector = ({onSelect}: {onSelect: (campus: Campus) => void}) => {
  const {
    campuses,
    selectedCampus,
    isLoading,
    error,
    fetchCampuses,
    selectCampus,
  } = useCampuses();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadInitialData = async () => {
      await fetchCampuses();

      // If there's a selected campus from the store, call onSelect
      if (selectedCampus) {
        onSelect(selectedCampus);
      }
    };

    loadInitialData();
  }, [fetchCampuses, onSelect, selectedCampus]);

  const filteredCampuses = campuses.filter(
    campus =>
      campus.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campus.campusName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelect = (campus: Campus) => {
    selectCampus(campus); // Update the store
    onSelect(campus); // Call the prop callback
    setIsOpen(false);
    setSearchQuery('');
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading campuses...</Text>
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
          {selectedCampus ? (
            <>
              <Feather name="map-pin" color="#003F66" size={24} />
              <Text style={styles.selectedCampusText}>
                {selectedCampus.displayName}
              </Text>
            </>
          ) : (
            <>
              <Feather name="map-pin" color="#003F66" size={24} />
              <Text style={styles.selectedCampusText}>Select Campus</Text>
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
              placeholder="Search campuses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />

            <FlatList
              data={filteredCampuses}
              keyExtractor={item => item.campusId}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.campusItem}
                  onPress={() => handleSelect(item)}>
                  <Text style={styles.campusDisplayName}>
                    {item.displayName}
                  </Text>
                  <Text style={styles.campusName}>{item.campusName}</Text>
                  <Text style={styles.campusLocation}>{item.location}</Text>
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
    padding: 15,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  locationIcon: {
    marginRight: 8,
  },
  selectedCampusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#003F66',
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
  campusItem: {
    padding: 12,
  },
  campusDisplayName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  campusName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  campusLocation: {
    fontSize: 12,
    color: '#777',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
});

export default CampusSelector;
