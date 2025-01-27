/* eslint-disable @typescript-eslint/no-shadow */
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import SubmitButton from '../../components/SubmitButton';
import axios from 'axios';
import { fetchCampusIds } from '../../services/fetchCampusIds';
import { getCampus, setCampus } from '../../utils/Storage';

export default function AddcampusBuzz() {
  const [campusId, setCampusId] = useState('');
  const [buzzName, setBuzzName] = useState('');
  const [buzzDescription, setBuzzDescription] = useState('');
  const [buzzUrl, setBuzzUrl] = useState('');
  const [buzzImage, setBuzzImage] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [campusOptions, setCampusOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>();
  const fetchCampus = async () => {
    try {
      const response = await fetchCampusIds();
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
      buzzName,
      buzzDescription,
      buzzUrl,
      buzzImage,
      endDate,
    };

    try {
      const response = await axios.post(
        'http://65.0.18.159:8080/quickVerse/v1/campusBuzz',
        payload, {
          headers: {
            'Content-Type': 'application/json',
          SessionKey:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjYW1wdXMiOiJJSU1VLTMxMzAwMSIsIm1vYmlsZSI6IjkxODk1MDYxOTY5MyIsImlhdCI6MTcyOTA5MzM0MCwiZXhwIjoxNzYwNjI5MzQwfQ.90AxXb82XTaMXHP8-6tn6xW2F8me6oEwWf2FWlrBYq4',
          Cookie: 'JSESSIONID=093C9E3EAFB15CE9BD4AEFD539BF98F8',
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Success', 'Campus Buzz submitted successfully!');
        setCampusId('');
        setBuzzName('');
        setBuzzDescription('');
        setBuzzUrl('');
        setBuzzImage('');
        setEndDate(new Date().toISOString());
      } else {
        Alert.alert('Error', 'Failed to submit promotion');
        console.error('Error:', response.data);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      Alert.alert('Error', 'Something went wrong while submitting the promotion.');
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
          <Text style={styles.heading}>Enter Campus Buzz Details</Text>
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

          <Text style={styles.label}>Buzz Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Buzz Name"
            value={buzzName}
            onChangeText={setBuzzName}
          />

          <Text style={styles.label}>Buzz Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Buzz Description"
            value={buzzDescription}
            onChangeText={setBuzzDescription}
          />

          <Text style={styles.label}>Buzz URL</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Buzz URL"
            value={buzzUrl}
            onChangeText={setBuzzUrl}
          />

          <Text style={styles.label}>Buzz Image</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Buzz Image URL"
            value={buzzImage}
            onChangeText={setBuzzImage}
          />

          <Text style={styles.label}>End Date</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>
              {new Date(endDate).toDateString()}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DatePicker
              modal
              open={showDatePicker}
              date={new Date(endDate)}
              mode="date"
              minimumDate={new Date()}  // Prevent selecting old dates including yesterday
              onConfirm={(date) => {
                setShowDatePicker(false);
                setEndDate(date.toISOString());
              }}
              onCancel={() => {
                setShowDatePicker(false);
              }}
            />
          )}

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
  dateText: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    lineHeight: 40,
  },
});
