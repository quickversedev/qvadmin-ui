import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { fetchCampusIds } from '../../services/fetchCampusIds';
import VendorCard from '../../components/VendorCard';
import SubmitButton from '../../components/SubmitButton';
import { getCampus, setCampus } from '../../utils/Storage';

interface Vendor {
  vendorId: string;
  vendorName: string;
}

export default function Vendors() {
  const [selectedCampus, setSelectedCampus] = useState<string>('');
  const [campusOptions, setCampusOptions] = useState<{ label: string; value: string }[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  useEffect(() => {
    const initializeCampus = async () => {
      try {
        const response = await fetchCampusIds();
        const options = response?.map((campus) => ({
          label: campus.campusName,
          value: campus.campusId,
        }));
        setCampusOptions(options);

        const storedCampus = await getCampus();
        setSelectedCampus(storedCampus || 'IIMU-313001');
      } catch (error) {
        console.error('Error fetching campus data:', error);
        Alert.alert('Error', 'Failed to fetch campus data. Please try again.');
      }
    };

    initializeCampus();
  }, []);

  useEffect(() => {
    if (selectedCampus) {
      setCampus(selectedCampus);
    }
  }, [selectedCampus]);

  useEffect(() => {
    if (selectedCampus) {
      const fetchVendors = async () => {
        try {
          const response = await axios.get(
            `http://65.0.18.159:8080/quickVerse/v1/campus/${selectedCampus}/vendors`,
            {
              headers: {
                Authorization: 'Basic cXZDYXN0bGVFbnRyeTpjYSR0bGVfUGVybWl0QDAx',
              },
            }
          );

          if (response.data?.vendors?.vendor) {
            setVendors(response.data.vendors.vendor);
          } else {
            console.error('Invalid vendor data structure');
            setVendors([]);
          }
        } catch (error) {
          console.error('Error fetching vendors:', error);
          Alert.alert('Error', 'Failed to fetch vendor data. Please try again.');
          setVendors([]);
        }
      };

      fetchVendors();
    } else {
      setVendors([]);
    }
  }, [selectedCampus]);

  const handleSubmit = () => {
    if (!selectedCampus) {
      Alert.alert('Error', 'Please select a campus before submitting.');
      return;
    }

    const dataToSend = {
      campusId: selectedCampus,
      vendors,
    };

    console.log('Submitting for campusId:', selectedCampus);
    console.log('Data to send:', JSON.stringify(dataToSend));

    setSubmissionSuccess(true);
    Alert.alert('Success', 'Vendor data logged successfully!');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Enter Vendor Details</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Campus Id</Text>
          <Picker
            selectedValue={selectedCampus}
            style={styles.input}
            onValueChange={(itemValue) => setSelectedCampus(itemValue)}
          >
            <Picker.Item label="Select Campus" value="" />
            {campusOptions.map((campus) => (
              <Picker.Item key={campus.value} label={campus.label} value={campus.value} />
            ))}
          </Picker>

          <View style={styles.vendorsContainer}>
            <Text style={styles.heading}>All Vendors</Text>
            {vendors.map((vendor) => (
              <VendorCard key={vendor.vendorId} vendorName={vendor.vendorName} />
            ))}
          </View>

          <SubmitButton title="Submit" onPress={handleSubmit} />
          {submissionSuccess && <Text style={styles.successMessage}>Submission Successful!</Text>}
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
  textContainer: {
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
  vendorsContainer: {
    marginVertical: 20,
  },
  successMessage: {
    marginTop: 20,
    color: 'green',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
