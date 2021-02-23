import { StatusBar } from 'expo-status-bar';
import React, {useEffect, useState, useRef} from 'react';
import { Button, StyleSheet, Text, TextInput, View, Platform, FlatList, Dimensions, } from 'react-native';
import DialogInput from 'react-native-dialog-input';
import AsyncStorage from '@react-native-community/async-storage';
import { render } from 'react-dom';

import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

// import NotifyMe from './notification';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function isNumber(str) {
  if (typeof str != "string") return false // we only process strings!
  // could also coerce to string: str = ""+str
  return !isNaN(str) && !isNaN(parseFloat(str))
}

export default function App() {
  const [listOfChores, setListOfChores]= useState([]);
  const [yesNo, setYesNo] = useState('yes');
  const [whateverInput, setWhateverInput] = useState();
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isManyHoursVisible, setIsManyHoursVisible] = useState(false);

  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);
  
  Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
  }

  const addHourData = async (inputText) => {
    if(inputText !== "nope"){
      if(isNumber(inputText) == true) {
        await schedulePushNotification(parseInt(inputText), listOfChores[0]);
      }
    } else {
      console.log('nope');
    }
    setIsManyHoursVisible(false);
  }

  useEffect(()=> {
    async function fetchData() {
      let value = await AsyncStorage.getItem('arrayOfMessages');
      let data = JSON.parse(value);
      setListOfChores(data);
    }
    fetchData();
  }, [yesNo]);

  const pressPlus = () => {
    setIsDialogVisible(true);
  }

  const addTheData = async (inputText) => {
    let currentInput = listOfChores;
    if (currentInput == null){
      currentInput = [];
    }
    currentInput.push(inputText);
    //console.log(typeof currentInput);
    //console.log(JSON.stringify(currentInput));
    await AsyncStorage.setItem('arrayOfMessages', JSON.stringify(currentInput.reverse()));
    let yes_or_no = yesNo;
    if (yes_or_no === 'yes'){
      setYesNo('no');
    } else {
      setYesNo('yes');
    }
    //console.log(currentInput);
    //console.log(currentInput.length);
    setIsDialogVisible(false);
    setIsManyHoursVisible(true);
    // alert(new Date().addHours(4));
  }

  const removeFromData = async (itemToRemove) => {
    console.log('starting process');
    let copyOfList = listOfChores;
    var indexOfItem = copyOfList.indexOf(itemToRemove);
    if (indexOfItem > -1) {
      copyOfList.splice(indexOfItem, 1);
    }
    await AsyncStorage.setItem('arrayOfMessages', JSON.stringify(copyOfList));
    let yes_or_no = yesNo;
    if (yes_or_no === 'yes'){
      setYesNo('no');
    } else {
      setYesNo('yes');
    }
    console.log('ending process');
  }

  const renderItemComponent = ({ item }) => {
    return(
      <View style={styles.listItem}>
        <Text style={{fontWeight: '700', fontSize: 15, flexShrink: 2, width: '90%'}}>{item}</Text>
        <View style={{alignItems: 'flex-start', flex:1, flexDirection: 'row-reverse', marginLeft: 10, }}>
          <Text style={{fontWeight: '700', fontSize: 20,}} onPress={()=>{removeFromData(item)}} >
            -
          </Text>
        </View>
      </View>
    );
  }

  const renderAllItems = () => {
    if(listOfChores.length != 0){
      return (<FlatList 
        style={styles.showList}
        data={listOfChores}
        renderItem={renderItemComponent}
      />);
    } else {
      return (
        <View style={{
          marginTop: 50,
          width: '95%',
          borderRadius: 25,
          backgroundColor: '#b950d4',
          padding: 15,
          alignItems: 'center',
        }}>
          <Text style={{
            fontWeight: '700',
            fontSize: 23
          }}>No Tasks To Do!</Text>
        </View>
      );
    }
  }
 
  return (
    <View style={styles.container}>
      {/* <NotifyMe /> */}
      <DialogInput isDialogVisible={isDialogVisible}
            title={"Add Task"}
            message={"New Task"}
            hintInput ={"Enter The Task You Want To Add"}
            submitInput={(inputText) => {addTheData(inputText)}}
            closeDialog={ () => {setIsDialogVisible(false)}}>
      </DialogInput>
      <DialogInput isDialogVisible={isManyHoursVisible}
            title={"Hours"}
            message={"Ammount of Hours To Be Reminded In"}
            hintInput ={"ONLY ENTER A NUMBER!!!!!!"}
            submitInput={(inputText) => {addHourData(inputText)}}
            closeDialog={ () => {addHourData("nope")}}>
      </DialogInput>
      {/* <FlatList 
        style={styles.showList}
        data={listOfChores}
        renderItem={renderItemComponent}
      /> */}
      {renderAllItems()}
      <Text style={styles.plus} onPress={pressPlus}>+</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9532a8',
    alignItems: 'center',
  },
  plus: {
    position: 'absolute',
    bottom: 3,
    right: 10,
    fontSize: 60,
    borderWidth: 3,
    paddingLeft: 27,
    paddingRight: 22,
    borderRadius: 50,
  },
  showList: {
    marginTop: 50,
    width: '95%',
    borderRadius: 25,
    backgroundColor: '#b950d4',
    flexGrow: 0
  }, 
  listItem: {
    flex:1,
    flexDirection: 'row',
    padding: 10,
    borderBottomColor: 'black',
    borderBottomWidth: 1,
    borderRadius: 25,
    alignItems: 'center',
  } 
});


async function schedulePushNotification(numHours, firstItem) {
  let injectHour;
  let itemToInject = firstItem;
  if(numHours == 0){
    injectHour = 1;
  } else {
    injectHour = Math.round(numHours) * 60 *60;
  }
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Reminder",
      body: `Go do "${itemToInject}"!!!`,
      data: { data: 'goes here' },
    },
    trigger: { seconds: injectHour },
  });
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}