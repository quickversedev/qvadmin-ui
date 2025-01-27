import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SubmitButton from '../../components/SubmitButton';
import { fetchCampusIds } from '../../services/fetchCampusIds';
import axios from 'axios';
import { getCampus, setCampus } from '../../utils/Storage';

export default function AddFeaturedItem() {
  const [vendorId, setVendorId] = useState<string>('');
  const [campusId, setCampusId] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [itemImage, setItemImage] = useState<string>('');
  const [itemDesc, setItemDesc] = useState<string>('');
  const [itemLink, setItemLink] = useState<string>('');

  const [campusOptions, setCampusOptions] = useState<{ label: string; value: string }[]>([]);
  // State to hold vendor data
  const [vendorOptions, setVendorOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>();
  const fetchCampus = async () => {
    try {
      const response = await fetchCampusIds();
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const campusOptions = response?.map(campus => ({
        label: campus.campusName,
        value: campus.campusId,
      }));
      setCampusOptions(campusOptions);
    } catch (error) {
      console.error('Error fetching campus data:', error);
      Alert.alert('Error', 'Failed to fetch campus data. Please try again.');
    }
  };

  useEffect(() => {
    const initializeCampus = async () => {
      await fetchCampus();
      const storedCampus = await getCampus();
      setSelectedCampus(storedCampus || 'IIMU-313001');
    };

    initializeCampus();
  }, []);

  useEffect(() => {
    if (selectedCampus) {
      setCampus(selectedCampus);
    }
  }, [selectedCampus]);

  const handleSubmit = async () => {
    const payload = {
      campusId,
      vendorId,
      itemName,
      itemImage,
      itemLink,
      itemDesc,
    };

    try {
      const response = await axios.post('http://65.0.18.159:8080/quickVerse/v1/featuredItem', payload, {
        headers: {
          'Content-Type': 'application/json',
          SessionKey:'',
        },
      });

      if (response.status === 200) {
        console.log('Item added successfully', response.data);

        setCampusId('');
        setVendorId('');
        setItemName('');
        setItemImage('');
        setItemDesc('');
        setItemLink('');
        setVendorOptions([]);
      } else {
        console.error('Failed to submit data', response.data);
      }
    } catch (error) {
      console.error('Error occurred during submission', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.TextContainer}>
          <Text style={styles.heading}>Enter Featured Item Details</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Campus Id</Text>
          <Picker
            selectedValue={campusId}
            style={styles.input}
            onValueChange={(itemValue) => setCampusId(itemValue)}
          >
            <Picker.Item label="Select Campus" value="" />
            {campusOptions.map((campus) => (
              <Picker.Item key={campus.value} label={campus.label} value={campus.value} />
            ))}
          </Picker>

          {/* Vendor Id Dropdown */}
          <Text style={styles.label}>Vendor Id</Text>
          <Picker
            selectedValue={vendorId}
            style={styles.input}
            onValueChange={(itemValue) => setVendorId(itemValue)}
          >
            <Picker.Item label="Select Vendor" value="" />
            {vendorOptions.map((vendor) => (
              <Picker.Item key={vendor.value} label={vendor.label} value={vendor.value} />
            ))}
          </Picker>

          {/* Item Name */}
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Name"
            value={itemName}
            onChangeText={setItemName}
          />

          {/* Item Image */}
          <Text style={styles.label}>Item Image</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Image Link"
            value={itemImage}
            onChangeText={setItemImage}
          />

          {/* Item Description */}
          <Text style={styles.label}>Item Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Description"
            value={itemDesc}
            onChangeText={setItemDesc}
          />

          {/* Item Link */}
          <Text style={styles.label}>Item Link</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Link"
            value={itemLink}
            onChangeText={setItemLink}
          />

          {/* Reusable Submit Button */}
          <SubmitButton title="Submit" onPress={handleSubmit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFDC52',
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  TextContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 25,
    fontWeight: '700',
    color: 'black',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 5,
    marginVertical: 10,
    paddingHorizontal: 10,
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
  },
  label: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
    marginBottom: 5,
  },
});
