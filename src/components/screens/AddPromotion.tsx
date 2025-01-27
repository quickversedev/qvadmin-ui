import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import SubmitButton from '../../components/SubmitButton';
import axios from 'axios';
import { fetchCampusIds } from '../../services/fetchCampusIds';
import { getCampus, setCampus } from '../../utils/Storage';

export default function AddPromotion() {
  const [campusId, setCampusId] = useState('');
  const [promoName, setPromoName] = useState('');
  const [promoImage, setPromoImage] = useState('');
  const [promoLink, setPromoLink] = useState('');

  const [campusOptions, setCampusOptions] = useState<{ label: string; value: string }[]>([]);
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
    if (!campusId || !promoName || !promoImage || !promoLink) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    const payload = {
      campusId: String(campusId),
      promoName: String(promoName),
      promoImage: String(promoImage),
      promoLink: String(promoLink),
    };

    try {
      const response = await axios.post('http://65.0.18.159:8080/quickVerse/v1/promotionItem', payload, {
        headers: {
          'Content-Type': 'application/json',
          SessionKey:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoic3VwZXItdXNlciIsImNhbXB1cyI6IklJTVUtMzEzMDAxIiwibW9iaWxlIjoiOTE4OTUwNjE5NjkzIiwiaWF0IjoxNzI5MTAxODQ1LCJleHAiOjE3NjA2Mzc4NDV9.LcmwtVNjVe-MzRxOL-gRIMEDFi8tlHQlAMjNbnTtjww',
          Cookie: 'JSESSIONID=093C9E3EAFB15CE9BD4AEFD539BF98F8',
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Promotion added successfully!');
        setCampusId('');
        setPromoName('');
        setPromoImage('');
        setPromoLink('');
      } else {
        console.error('Error:', response.data);
        Alert.alert('Error', 'Failed to add promotion.');
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
          <Text style={styles.heading}>Enter Promotion Details</Text>
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

          {/* Promotion Name */}
          <Text style={styles.label}>Promotion Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Promotion Name"
            value={promoName}
            onChangeText={(text) => setPromoName(String(text))}
          />

          {/* Promotion Image Link */}
          <Text style={styles.label}>Promotion Image Link</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Promotion Image Link"
            value={promoImage}
            onChangeText={(text) => setPromoImage(String(text))}
          />

          {/* Promotion Link */}
          <Text style={styles.label}>Promotion Link</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Promotion Link"
            value={promoLink}
            onChangeText={(text) => setPromoLink(String(text))}
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
