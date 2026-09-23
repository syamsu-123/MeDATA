import React, { useState, useEffect } from 'react';
import { useLocationContext } from './src/context/LocationContext';
import { useAuth } from './src/context/AuthContext';

const PatientForm = ({ patient, onSubmit, onCancel }) => {
  const { currentLocation } = useLocationContext();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    birthDate: '',
    gender: 'Laki-laki',
    phone: '',
    address: '',
    location: currentLocation,
    status: 'aktif',
    createdBy: user?.uid || '',
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        ...patient,
        birthDate: patient.birthDate || '', // Ensure birthDate is not undefined
      });
    } else {
      // Reset form for new patient
      setFormData({
        patientId: `MD${Date.now().toString().slice(-5)}`, // Simple unique ID
        name: '',
        birthDate: '',
        gender: 'Laki-laki',
        phone: '',
        address: '',
        location: currentLocation,
        status: 'aktif',
        createdBy: user?.uid || '',
      });
    }
  }, [patient, currentLocation, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required className="mt-1 w-full input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">ID Pasien</label>
          <input type="text" name="patientId" value={formData.patientId} onChange={handleChange} required className="mt-1 w-full input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tanggal Lahir</label>
          <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required className="mt-1 w-full input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Jenis Kelamin</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 w-full input-field">
            <option>Laki-laki</option>
            <option>Perempuan</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">No. Telepon</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 w-full input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="mt-1 w-full input-field">
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Alamat</label>
        <textarea name="address" value={formData.address} onChange={handleChange} rows="3" className="mt-1 w-full input-field"></textarea>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Batal
        </button>
        <button type="submit" className="btn-primary">
          Simpan
        </button>
      </div>
    </form>
  );
};

export default PatientForm;