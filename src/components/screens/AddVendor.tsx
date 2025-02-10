import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Switch, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import SubmitButton from '../../components/SubmitButton'; // Import SubmitButton component
import axios from 'axios'; // Import axios for API call

export default function AddVendor() {
  const [vendorId] = useState<string>('IIMU-001'); // Hardcoded vendorId
  const [campusId] = useState<string>('IIMU-313001'); // Hardcoded campusId
  const [vendorName, setVendorName] = useState<string>('');
  const [vendorEndPoint, setVendorEndPoint] = useState<string>('');
  const [vendorBanner, setVendorBanner] = useState<string>('');
  const [vendorOwner, setVendorOwner] = useState<string>('');
  const [vendorPhone, setVendorPhone] = useState<string>('');
  const [distance, setDistance] = useState<string>(''); // Updated to string
  const [storeDescription, setStoreDescription] = useState<string>('');
  const [storeCategory, setStoreCategory] = useState<string>('');
  const [storeEnabled, setStoreEnabled] = useState<boolean>(false); // Boolean
  const [storeOpeningTime, setStoreOpeningTime] = useState<Date>(new Date());
  const [storeClosingTime, setStoreClosingTime] = useState<Date>(new Date());
  const [showOpeningTimePicker, setShowOpeningTimePicker] = useState<boolean>(false);
  const [showClosingTimePicker, setShowClosingTimePicker] = useState<boolean>(false);

  const handleSubmit = async () => {
    try {
      const data = {
        vendorId,
        campusId,
        vendorName,
        vendorEndPoint,
        vendorBanner,
        vendorOwner,
        vendorPhone,
        distance: `${distance} Mins`,
        storeOpeningTime: storeOpeningTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        storeClosingTime: storeClosingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        storeDescription,
        storeCategory,
        storeEnabled: storeEnabled.toString(),
      };

      console.log('Submitting data:', data);

      await axios({
        method: 'put',
        url: 'http://65.0.18.159:8080/quickVerse/v1/vendor',
        headers: {
          'Content-Type': 'application/json',
          SessionKey:'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJjYW1wdXMiOiJJSU1VLTMxMzAwMSIsIm1vYmlsZSI6IjkxODk1MDYxOTY5MyIsImlhdCI6MTcyOTA5MzM0MCwiZXhwIjoxNzYwNjI5MzQwfQ.90AxXb82XTaMXHP8-6tn6xW2F8me6oEwWf2FWlrBYq4',
          Cookie: 'JSESSIONID=093C9E3EAFB15CE9BD4AEFD539BF98F8',
        },
        data,
      });

      console.log('Vendor submitted successfully');

      setVendorName('');
      setVendorEndPoint('');
      setVendorBanner('');
      setVendorOwner('');
      setVendorPhone('');
      setDistance('');
      setStoreDescription('');
      setStoreCategory('');
      setStoreEnabled(false);
      setStoreOpeningTime(new Date());
      setStoreClosingTime(new Date());
    } catch (error) {
      console.error('Error submitting vendor:', error.response ? error.response.data : error.message);
    }
  };


  const handleOpeningTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowOpeningTimePicker(false);
    if (selectedTime) {
      setStoreOpeningTime(selectedTime);
    }
  };

  const handleClosingTimeChange = (event: any, selectedTime: Date | undefined) => {
    setShowClosingTimePicker(false);
    if (selectedTime) {
      setStoreClosingTime(selectedTime);
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
          <Text style={styles.heading}>Enter Vendor Details</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Vendor Name */}
          <Text style={styles.label}>Vendor Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Vendor Name"
            value={vendorName}
            onChangeText={setVendorName}
          />

          {/* EndPoint Url */}
          <Text style={styles.label}>Vendor EndPoint</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter EndPoint Url"
            value={vendorEndPoint}
            onChangeText={setVendorEndPoint}
          />

          {/* Vendor Banner */}
          <Text style={styles.label}>Vendor Banner</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Vendor Banner Url"
            value={vendorBanner}
            onChangeText={setVendorBanner}
          />

          {/* Owner Name */}
          <Text style={styles.label}>Vendor Owner</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Owner Name"
            value={vendorOwner}
            onChangeText={setVendorOwner}
          />

          {/* Phone Number */}
          <Text style={styles.label}>Vendor Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Phone Number"
            keyboardType="numeric"
            value={vendorPhone}
            onChangeText={setVendorPhone}
          />

          {/* Distance in Minutes */}
          <Text style={styles.label}>Distance in Minutes</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Distance in Minutes"
            keyboardType="numeric"
            value={distance}
            onChangeText={setDistance}
          />

          {/* Store Description */}
          <Text style={styles.label}>Store Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Store Description"
            value={storeDescription}
            onChangeText={setStoreDescription}
          />

          {/* Store Category */}
          <Text style={styles.label}>Store Category</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Store Category"
            value={storeCategory}
            onChangeText={setStoreCategory}
          />

          {/* Store Opening Time */}
          <View style={styles.timePickerContainer}>
            <Text style={styles.label}>Store Opening Time</Text>
            <TouchableOpacity onPress={() => setShowOpeningTimePicker(true)} style={styles.timePickerButton}>
              <Text style={styles.input}>
                {storeOpeningTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {showOpeningTimePicker && (
              <DateTimePicker
                value={storeOpeningTime}
                mode="time"
                display="default"
                onChange={handleOpeningTimeChange}
              />
            )}
          </View>

          {/* Store Closing Time */}
          <View style={styles.timePickerContainer}>
            <Text style={styles.label}>Store Closing Time</Text>
            <TouchableOpacity onPress={() => setShowClosingTimePicker(true)} style={styles.timePickerButton}>
              <Text style={styles.input}>
                {storeClosingTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {showClosingTimePicker && (
              <DateTimePicker
                value={storeClosingTime}
                mode="time"
                display="default"
                onChange={handleClosingTimeChange}
              />
            )}
          </View>

          {/* Store Enabled */}
          <View style={styles.switchContainer}>
            <Text style={styles.label}>Store Enabled</Text>
            <Switch
              value={storeEnabled}
              onValueChange={setStoreEnabled} // Boolean
            />
          </View>

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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  timePickerContainer: {
    marginVertical: 10,
  },
  timePickerButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
