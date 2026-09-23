import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const PatientTable = ({ patients, loading, error, onEdit, onDelete }) => {
  if (loading) {
    return <div className="text-center p-10">Memuat data pasien...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (patients.length === 0) {
    return <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-lg shadow">Belum ada pasien di lokasi ini.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
      <table className="w-full min-w-max text-left">
        <thead className="border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="p-4">ID Pasien</th>
            <th className="p-4">Nama</th>
            <th className="p-4">Tgl Lahir</th>
            <th className="p-4">Status</th>
            <th className="p-4">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="p-4 font-mono text-sm">{patient.patientId}</td>
              <td className="p-4 font-semibold">{patient.name}</td>
              <td className="p-4">{patient.birthDate}</td>
              <td className="p-4">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  patient.status === 'aktif'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {patient.status}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(patient)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(patient)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientTable;