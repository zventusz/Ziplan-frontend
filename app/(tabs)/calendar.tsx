import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addDays, format, subDays } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const EVENTS_STORAGE_KEY = 'mealEvents';

export default function CalendarScreen() {
  const { prefillTitle, prefillDescription, openAddModal } = useLocalSearchParams();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    description: '',
    date: new Date(),
  });
  const [editingEventIndex, setEditingEventIndex] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // NEW: States for start/end time pickers
  const [startTime, setStartTime] = useState(new Date(new Date().setHours(8, 0)));
  const [endTime, setEndTime] = useState(new Date(new Date().setHours(10, 0)));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showEditStartPicker, setShowEditStartPicker] = useState(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState(false);

  // Load saved events from AsyncStorage on mount
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const savedEventsStr = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
        if (savedEventsStr) {
          setEvents(JSON.parse(savedEventsStr));
        }
      } catch (e) {
        console.error('Failed to load events from storage', e);
      }
    };
    loadEvents();
  }, []);

  // Save events to AsyncStorage whenever events state changes
  useEffect(() => {
    const saveEvents = async () => {
      try {
        await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      } catch (e) {
        console.error('Failed to save events to storage', e);
      }
    };
    saveEvents();
  }, [events]);

  useEffect(() => {
    if (openAddModal === 'true') {
      setNewEvent((prev) => ({
        ...prev,
        title: prefillTitle || '',
        description: prefillDescription || '',
      }));
      setModalVisible(true);
    }
  }, [openAddModal, prefillTitle, prefillDescription]);

  // Sync start/end string times to Date objects when newEvent changes
  useEffect(() => {
    if (newEvent.start) {
      const [h, m] = newEvent.start.split(':').map(Number);
      const dt = new Date(newEvent.date);
      dt.setHours(h, m);
      setStartTime(dt);
    }
    if (newEvent.end) {
      const [h, m] = newEvent.end.split(':').map(Number);
      const dt = new Date(newEvent.date);
      dt.setHours(h, m);
      setEndTime(dt);
    }
  }, [newEvent.start, newEvent.end, newEvent.date]);

  // Sync start/end string times to Date objects for edit modal
  useEffect(() => {
    if (editModalVisible && newEvent.start) {
      const [h, m] = newEvent.start.split(':').map(Number);
      const dt = new Date(newEvent.date);
      dt.setHours(h, m);
      setStartTime(dt);
    }
    if (editModalVisible && newEvent.end) {
      const [h, m] = newEvent.end.split(':').map(Number);
      const dt = new Date(newEvent.date);
      dt.setHours(h, m);
      setEndTime(dt);
    }
  }, [editModalVisible, newEvent.start, newEvent.end, newEvent.date]);

  // New Event Date picker
  const onChangeNewEventDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewEvent((prev) => ({ ...prev, date: selectedDate }));
      setCurrentDate(selectedDate);
    }
  };

  // Edit Event Date picker
  const onChangeEditEventDate = (event, selectedDate) => {
    setShowEditDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setNewEvent((prev) => ({ ...prev, date: selectedDate }));
      setCurrentDate(selectedDate);
    }
  };

  // Start time picker for New Event
  const onStartTimeChange = (event, selectedTime) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
      setNewEvent((prev) => ({ ...prev, start: format(selectedTime, 'HH:mm') }));
    }
  };

  // End time picker for New Event
  const onEndTimeChange = (event, selectedTime) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
      setNewEvent((prev) => ({ ...prev, end: format(selectedTime, 'HH:mm') }));
    }
  };

  // Start time picker for Edit Event
  const onEditStartTimeChange = (event, selectedTime) => {
    setShowEditStartPicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
      setNewEvent((prev) => ({ ...prev, start: format(selectedTime, 'HH:mm') }));
    }
  };

  // End time picker for Edit Event
  const onEditEndTimeChange = (event, selectedTime) => {
    setShowEditEndPicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
      setNewEvent((prev) => ({ ...prev, end: format(selectedTime, 'HH:mm') }));
    }
  };

  const addEvent = () => {
    if (newEvent.title && newEvent.start && newEvent.end) {
      setEvents((prev) => [
        ...prev,
        { ...newEvent, date: newEvent.date, id: Date.now().toString() + Math.random() },
      ]);
      setNewEvent({ title: '', start: '', end: '', description: '', date: new Date() });
      setModalVisible(false);
      setShowDatePicker(false);
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  };

  const saveEditedEvent = () => {
    if (
      editingEventIndex !== null &&
      editingEventIndex >= 0 &&
      editingEventIndex < events.length
    ) {
      const updatedEvents = [...events];
      updatedEvents[editingEventIndex] = {
        ...updatedEvents[editingEventIndex],
        ...newEvent,
        id: updatedEvents[editingEventIndex].id,
      };
      setEvents(updatedEvents);
      setEditModalVisible(false);
      setEditingEventIndex(null);
      setShowEditDatePicker(false);
      setShowEditStartPicker(false);
      setShowEditEndPicker(false);
    }
  };

  const deleteEvent = () => {
    if (
      editingEventIndex !== null &&
      editingEventIndex >= 0 &&
      editingEventIndex < events.length
    ) {
      const updatedEvents = [...events];
      updatedEvents.splice(editingEventIndex, 1);
      setEvents(updatedEvents);
      setEditModalVisible(false);
      setEditingEventIndex(null);
      setShowEditDatePicker(false);
      setShowEditStartPicker(false);
      setShowEditEndPicker(false);
    }
  };

  const getEventsForDate = () =>
    events.filter(
      (event) => new Date(event.date).toDateString() === currentDate.toDateString()
    );

  const openEditModal = (event, index) => {
    setNewEvent({
      title: event.title,
      start: event.start,
      end: event.end,
      description: event.description || '',
      date: new Date(event.date),
      id: event.id,
    });
    setEditingEventIndex(index);
    setEditModalVisible(true);
  };

  const renderEvents = () =>
    getEventsForDate().map((event, idx) => {
      const [startHour, startMin] = event.start.split(':').map(Number);
      const [endHour, endMin] = event.end.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const top = (startMinutes / 60) * 60;
      const height = ((endMinutes - startMinutes) / 60) * 60;

      return (
        <TouchableOpacity
          key={`${event.id}-${idx}`}
          style={[styles.eventBlock, { top, height }]}
          onPress={() => openEditModal(event, idx)}
        >
          <Text style={styles.eventText}>{event.title}</Text>
          <Text style={styles.eventText}>
            {event.start} - {event.end}
          </Text>
        </TouchableOpacity>
      );
    });

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentDate(subDays(currentDate, 1))}>
          <Text style={styles.arrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.date}>{format(currentDate, 'EEEE, MMM d')}</Text>
        <TouchableOpacity onPress={() => setCurrentDate(addDays(currentDate, 1))}>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ height: 1440 }}>
          <View style={styles.timelineContainer}>
            {Array.from({ length: 24 }, (_, hour) => {
              const label = `${hour.toString().padStart(2, '0')}:00`;
              return (
                <View key={hour} style={styles.hourRow}>
                  <Text style={styles.hourText}>{label}</Text>
                </View>
              );
            })}
            <View style={styles.eventsOverlay}>{renderEvents()}</View>
          </View>
        </ScrollView>
      </View>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* New Event Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Meal Event</Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Text style={{ fontWeight: '600' }}>
                Select Date: {format(newEvent.date, 'yyyy-MM-dd')}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={newEvent.date}
                mode="date"
                display="default"
                onChange={onChangeNewEventDate}
              />
            )}

            <TextInput
              placeholder="Meal Name"
              style={styles.input}
              value={newEvent.title}
              onChangeText={(text) => setNewEvent((prev) => ({ ...prev, title: text }))}
            />

            {/* REPLACED: Start time input */}
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={styles.input}
            >
              <Text>{startTime ? format(startTime, 'HH:mm') : 'Select Start Time'}</Text>
            </TouchableOpacity>
            {showStartPicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="time"
                display="spinner"
                onChange={onStartTimeChange}
              />
            )}

            {/* REPLACED: End time input */}
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={styles.input}
            >
              <Text>{endTime ? format(endTime, 'HH:mm') : 'Select End Time'}</Text>
            </TouchableOpacity>
            {showEndPicker && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="time"
                display="spinner"
                onChange={onEndTimeChange}
              />
            )}

            <TextInput
              placeholder="Description"
              style={[styles.input, { height: 80 }]}
              value={newEvent.description}
              multiline
              onChangeText={(text) => setNewEvent((prev) => ({ ...prev, description: text }))}
            />
            <TouchableOpacity style={styles.saveButton} onPress={addEvent}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                setShowDatePicker(false);
                setShowStartPicker(false);
                setShowEndPicker(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit/Delete Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Meal Event</Text>

            <TouchableOpacity
              onPress={() => setShowEditDatePicker(true)}
              style={styles.datePickerButton}
            >
              <Text style={{ fontWeight: '600' }}>
                Select Date: {format(newEvent.date, 'yyyy-MM-dd')}
              </Text>
            </TouchableOpacity>
            {showEditDatePicker && (
              <DateTimePicker
                value={newEvent.date}
                mode="date"
                display="default"
                onChange={onChangeEditEventDate}
              />
            )}

            <TextInput
              placeholder="Meal Name"
              style={styles.input}
              value={newEvent.title}
              onChangeText={(text) => setNewEvent((prev) => ({ ...prev, title: text }))}
            />

            {/* REPLACED: Start time input */}
            <TouchableOpacity
              onPress={() => setShowEditStartPicker(true)}
              style={styles.input}
            >
              <Text>{startTime ? format(startTime, 'HH:mm') : 'Select Start Time'}</Text>
            </TouchableOpacity>
            {showEditStartPicker && (
              <DateTimePicker
                value={startTime || new Date()}
                mode="time"
                display="spinner"
                onChange={onEditStartTimeChange}
              />
            )}

            {/* REPLACED: End time input */}
            <TouchableOpacity
              onPress={() => setShowEditEndPicker(true)}
              style={styles.input}
            >
              <Text>{endTime ? format(endTime, 'HH:mm') : 'Select End Time'}</Text>
            </TouchableOpacity>
            {showEditEndPicker && (
              <DateTimePicker
                value={endTime || new Date()}
                mode="time"
                display="spinner"
                onChange={onEditEndTimeChange}
              />
            )}

            <TextInput
              placeholder="Description"
              style={[styles.input, { height: 80 }]}
              value={newEvent.description}
              multiline
              onChangeText={(text) => setNewEvent((prev) => ({ ...prev, description: text }))}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveEditedEvent}>
              <Text style={styles.saveButtonText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: '#FF6B6B' }]}
              onPress={deleteEvent}
            >
              <Text style={[styles.saveButtonText, { color: 'white' }]}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setEditModalVisible(false);
                setShowEditDatePicker(false);
                setShowEditStartPicker(false);
                setShowEditEndPicker(false);
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#FCE38A',
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  arrow: {
    fontSize: 22,
    paddingHorizontal: 10,
  },
  timelineContainer: {
    flex: 1,
    position: 'relative',
  },
  hourRow: {
    height: 60,
    borderBottomWidth: 1,
    borderColor: '#eee',
    justifyContent: 'flex-start',
    paddingTop: 5,
    paddingLeft: 10,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventsOverlay: {
    position: 'absolute',
    left: 100,
    right: 20,
    top: 0,
  },
  eventBlock: {
    position: 'absolute',
    backgroundColor: '#CEEE67',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
    justifyContent: 'center',
  },
  eventText: {
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 70,
    right: 20,
    backgroundColor: '#CEEE67',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    zIndex: 10,
  },
  fabText: {
    fontSize: 28,
    color: '#000',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: '#CEEE67',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelText: {
    textAlign: 'center',
    marginTop: 10,
    color: 'red',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
});
