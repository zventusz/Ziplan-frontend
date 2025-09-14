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
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [showEditStartPicker, setShowEditStartPicker] = useState(false);
  const [showEditEndPicker, setShowEditEndPicker] = useState(false);

  // Load saved events
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const savedEventsStr = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
        if (savedEventsStr) setEvents(JSON.parse(savedEventsStr));
      } catch (e) {
        console.error('Failed to load events', e);
      }
    };
    loadEvents();
  }, []);

  // Save events
  useEffect(() => {
    const saveEvents = async () => {
      try {
        await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(events));
      } catch (e) {
        console.error('Failed to save events', e);
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

  // Handlers
  const addEvent = () => {
    if (newEvent.title && newEvent.start && newEvent.end) {
      setEvents((prev) => [
        ...prev,
        { ...newEvent, id: Date.now().toString() + Math.random() },
      ]);
      setNewEvent({ title: '', start: '', end: '', description: '', date: new Date() });
      setModalVisible(false);
    }
  };

  const saveEditedEvent = () => {
    if (editingEventIndex !== null) {
      const updated = [...events];
      updated[editingEventIndex] = { ...newEvent, id: events[editingEventIndex].id };
      setEvents(updated);
      setEditModalVisible(false);
      setEditingEventIndex(null);
    }
  };

  const deleteEvent = () => {
    if (editingEventIndex !== null) {
      const updated = [...events];
      updated.splice(editingEventIndex, 1);
      setEvents(updated);
      setEditModalVisible(false);
      setEditingEventIndex(null);
    }
  };

  const getEventsForDate = () =>
    events.filter(
      (e) => new Date(e.date).toDateString() === currentDate.toDateString()
    );

  const openEditModal = (event, index) => {
    setNewEvent(event);
    setEditingEventIndex(index);
    setEditModalVisible(true);
  };

  const renderEvents = () =>
    getEventsForDate().map((event, idx) => {
      const [sh, sm] = event.start.split(':').map(Number);
      const [eh, em] = event.end.split(':').map(Number);
      const top = (sh * 60 + sm) / 60;
      const height = ((eh * 60 + em) - (sh * 60 + sm)) / 60;

      return (
        <TouchableOpacity
          key={`${event.id}-${idx}`}
          style={[styles.eventBlock, { top: top * 60, height: height * 60 }]}
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
            {Array.from({ length: 24 }, (_, hour) => (
              <View key={hour} style={styles.hourRow}>
                <Text style={styles.hourText}>{`${hour.toString().padStart(2, '0')}:00`}</Text>
              </View>
            ))}
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

            {/* Date picker */}
            {Platform.OS === 'web' ? (
              <input
                type="date"
                className="border rounded p-2 w-full"
                value={format(newEvent.date, 'yyyy-MM-dd')}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, date: new Date(e.target.value) }))
                }
              />
            ) : (
              <>
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
                    onChange={(_, d) => d && setNewEvent((p) => ({ ...p, date: d }))}
                  />
                )}
              </>
            )}

            <TextInput
              placeholder="Meal Name"
              style={styles.input}
              value={newEvent.title}
              onChangeText={(t) => setNewEvent((p) => ({ ...p, title: t }))}
            />

            {/* Start */}
            {Platform.OS === 'web' ? (
              <input
                type="time"
                className="border rounded p-2 w-full"
                value={newEvent.start}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, start: e.target.value }))
                }
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowStartPicker(true)}
                  style={styles.input}
                >
                  <Text>{newEvent.start || 'Select Start Time'}</Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(_, t) =>
                      t && setNewEvent((p) => ({ ...p, start: format(t, 'HH:mm') }))
                    }
                  />
                )}
              </>
            )}

            {/* End */}
            {Platform.OS === 'web' ? (
              <input
                type="time"
                className="border rounded p-2 w-full"
                value={newEvent.end}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, end: e.target.value }))
                }
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowEndPicker(true)}
                  style={styles.input}
                >
                  <Text>{newEvent.end || 'Select End Time'}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(_, t) =>
                      t && setNewEvent((p) => ({ ...p, end: format(t, 'HH:mm') }))
                    }
                  />
                )}
              </>
            )}


            <TextInput
              placeholder="Description"
              style={[styles.input, { height: 80 }]}
              value={newEvent.description}
              multiline
              onChangeText={(t) => setNewEvent((p) => ({ ...p, description: t }))}
            />
            <TouchableOpacity style={styles.saveButton} onPress={addEvent}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Meal Event</Text>

            {/* Date */}
            {Platform.OS === 'web' ? (
              <input
                type="date"
                className="border rounded p-2 w-full mb-2"
                value={format(newEvent.date, 'yyyy-MM-dd')}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, date: new Date(e.target.value) }))
                }
              />
            ) : (
              <>
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
                    onChange={(_, d) => d && setNewEvent((p) => ({ ...p, date: d }))}
                  />
                )}
              </>
            )}

            <TextInput
              placeholder="Meal Name"
              style={styles.input}
              value={newEvent.title}
              onChangeText={(t) => setNewEvent((p) => ({ ...p, title: t }))}
            />

            {/* Start */}
            {Platform.OS === 'web' ? (
              <input
                type="time"
                className="border rounded p-2 w-full mb-2"
                value={newEvent.start}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, start: e.target.value }))
                }
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowEditStartPicker(true)}
                  style={styles.input}
                >
                  <Text>{newEvent.start || 'Select Start Time'}</Text>
                </TouchableOpacity>
                {showEditStartPicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(_, t) =>
                      t && setNewEvent((p) => ({ ...p, start: format(t, 'HH:mm') }))
                    }
                  />
                )}
              </>
            )}

            {/* End */}
            {Platform.OS === 'web' ? (
              <input
                type="time"
                className="border rounded p-2 w-full mb-2"
                value={newEvent.end}
                onChange={(e) =>
                  setNewEvent((p) => ({ ...p, end: e.target.value }))
                }
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => setShowEditEndPicker(true)}
                  style={styles.input}
                >
                  <Text>{newEvent.end || 'Select End Time'}</Text>
                </TouchableOpacity>
                {showEditEndPicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    display="spinner"
                    onChange={(_, t) =>
                      t && setNewEvent((p) => ({ ...p, end: format(t, 'HH:mm') }))
                    }
                  />
                )}
              </>
            )}

            <TextInput
              placeholder="Description"
              style={[styles.input, { height: 80 }]}
              value={newEvent.description}
              multiline
              onChangeText={(t) => setNewEvent((p) => ({ ...p, description: t }))}
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
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#fff' },
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
  date: { fontSize: 18, fontWeight: 'bold' },
  arrow: { fontSize: 22, paddingHorizontal: 10 },
  timelineContainer: { flex: 1, position: 'relative' },
  hourRow: {
    height: 60,
    borderBottomWidth: 1,
    borderColor: '#eee',
    justifyContent: 'flex-start',
    paddingTop: 5,
    paddingLeft: 10,
  },
  hourText: { fontSize: 14, fontWeight: '600' },
  eventsOverlay: { position: 'absolute', left: 100, right: 20, top: 0 },
  eventBlock: {
    position: 'absolute',
    backgroundColor: '#CEEE67',
    padding: 6,
    borderRadius: 6,
    marginBottom: 4,
    justifyContent: 'center',
  },
  eventText: { fontSize: 13 },
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
  fabText: { fontSize: 28, color: '#000' },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 20,
  },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
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
  saveButtonText: { fontWeight: 'bold', fontSize: 16 },
  cancelText: { textAlign: 'center', marginTop: 10, color: 'red' },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
});
