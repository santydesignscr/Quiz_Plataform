import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Asume la estructura del diseño de shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BackupRestore = () => {
  const [backupFile, setBackupFile] = useState(null);
  const [password, setPassword] = useState('');
  const { toast } = useToast()

  const handleBackupDownload = async () => {
    try {
      const response = await axios.get(API_URL+'/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: 'Backup descargado con éxito' });
    } catch (error) {
      toast({ title: 'Error al descargar el backup', description: error.message, variant: 'destructive' });
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!backupFile) {
      toast({ title: 'Selecciona un archivo para restaurar', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('backup', backupFile);
    formData.append('password', password);

    try {
      const response = await axios.post(API_URL+'/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: response.data.message });
    } catch (error) {
      toast({ title: 'Error al restaurar', description: error.response?.data?.message || error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Respaldo y Restauración</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleBackupDownload} className="w-full mb-4">
            Descargar Backup
          </Button>
          <form onSubmit={handleRestoreSubmit}>
            <div className="mb-4">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <Label htmlFor="file">Archivo de respaldo</Label>
              <Input
                type="file"
                id="file"
                onChange={(e) => setBackupFile(e.target.files[0])}
                accept=".zip"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Restaurar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupRestore;