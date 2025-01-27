import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import CustomButton from '../../components/CustomButton';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../routes/AppStack';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../data/images/qv-blue.png')}
          style={styles.logo}
        />
        <Text style={styles.description}>
          India's First Hyper Local Delivery Startup
        </Text>
      </View>
      <View style={styles.buttonsContainer}>
        <CustomButton
          onPress={() => navigation.navigate('AddVendor')}
          title="Add New Vendor"
        />
        <CustomButton
          onPress={() => navigation.navigate('AddLaundry')}
          title="Add Laundry Item"
        />
        <CustomButton
          onPress={() => navigation.navigate('AddFeaturedItem')}
          title="Add Featured Item"
        />
        <CustomButton
          onPress={() => navigation.navigate('CampusBuzz')}
          title="CampusBuzz"
        />
        <CustomButton
          onPress={() => navigation.navigate('AddPromotion')}
          title="Add New Promotion"
        />
        <CustomButton
          onPress={() => navigation.navigate('Vendors')}
          title="Vendors"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFDC52',
  },
  logoContainer: {
    height: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 250,
    height: 250,
    marginBottom: 50,
  },
  description: {
    fontSize: 19,
    fontWeight: '900',
    color: 'black',
  },
  buttonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HomeScreen;
