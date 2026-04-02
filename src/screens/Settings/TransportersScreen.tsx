import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {StackScreenProps} from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {SettingsStackParamList} from '../../navigation/SettingsNavigation';

type Props = StackScreenProps<SettingsStackParamList, 'Transporters'>;

const mockTransporters = ['Ravi Kumar', 'Sandeep Yadav', 'Pooja Sharma'];

const TransportersScreen: React.FC<Props> = ({navigation}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Back">
            <MaterialCommunityIcons name="arrow-left" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Delivery Partners</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('AddTransporter')}>
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={mockTransporters}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.listContent}
          renderItem={({item}) => (
            <View style={styles.transporterCard}>
              <MaterialCommunityIcons name="truck-fast-outline" size={20} color="#0F766E" />
              <Text style={styles.transporterName}>{item}</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addText: {
    marginLeft: 4,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 16,
  },
  transporterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transporterName: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
});

export default TransportersScreen;
