import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SubmitButton from '../../components/SubmitButton';
import axios from 'axios';
import { fetchCampusIds } from '../../services/fetchCampusIds';
import { getCampus, setCampus } from '../../utils/Storage';

export default function AddLaundry() {
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>();
  const [campusId, setCampusId] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [itemImage, setItemImage] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [available] = useState<boolean>(true);
  const [ironRate, setIronRate] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');

  const [campusOptions, setCampusOptions] = useState<{ label: string; value: string }[]>([]);

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
    if (!campusId) {
      Alert.alert('Error', 'Please select a campus.');
      return;
    }

    const apiUrl = 'http://65.0.18.159:8080/quickVerse/v1/laundryItems';

    const data = {
      campusId,
      itemName,
      itemImage,
      itemPrice,
      category,
      available,
      ironRate,
      discount,
    };

    try {
      const response = await axios.post(apiUrl, data, {
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'JSESSIONID=093C9E3EAFB15CE9BD4AEFD539BF98F8',
        },
      });

      if (response.status === 200 || response.status === 201) {
        console.log('Item successfully uploaded', response.data);
        Alert.alert('Success', 'Item successfully uploaded!');

        setCampusId('');
        setItemName('');
        setItemImage('');
        setItemPrice('');
        setCategory('');
        setIronRate('');
        setDiscount('');
      } else {
        Alert.alert('Error', 'Failed to upload item.');
        console.error('Failed to upload item:', response.data);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Server Error:', error.response.data);
          Alert.alert('Error', `Server Error: ${error.response.data.message || 'Unknown error'}`);
        } else if (error.request) {
          console.error('No response from server:', error.message);
          Alert.alert('Error', 'No response from server. Please try again.');
        } else {
          console.error('Axios Error:', error.message);
          Alert.alert('Error', `Axios Error: ${error.message}`);
        }
      } else {
        console.error('An unknown error occurred:', error);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
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
          <Text style={styles.heading}>Enter Item Details</Text>
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

          {/* Item Name */}
          <Text style={styles.label}>Item Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Name"
            value={itemName}
            onChangeText={setItemName}
          />

          {/* Item Image URL */}
          <Text style={styles.label}>Item Image URL</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Image URL"
            value={itemImage}
            onChangeText={setItemImage}
          />

          {/* Item Price */}
          <Text style={styles.label}>Item Price (₹)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Item Price"
            keyboardType="numeric"
            value={itemPrice}
            onChangeText={setItemPrice}
          />

          {/* Category Dropdown */}
          <Text style={styles.label}>Category</Text>
          <Picker
            selectedValue={category}
            style={styles.input}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            <Picker.Item label="Select Category" value="" />
            <Picker.Item label="Category 1" value="1" />
            <Picker.Item label="Category 2" value="2" />
          </Picker>

          {/* Iron Rate */}
          <Text style={styles.label}>Iron Rate</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Iron Rate"
            keyboardType="numeric"
            value={ironRate}
            onChangeText={setIronRate}
          />

          {/* Discount in % */}
          <Text style={styles.label}>Discount (%)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Discount"
            keyboardType="numeric"
            value={discount}
            onChangeText={setDiscount}
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
    justifyContent: 'center',
  },
  label: {
    fontSize: 20,
    fontWeight: '500',
    color: 'black',
    marginBottom: 5,
  },
});
