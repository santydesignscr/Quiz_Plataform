import React, { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Backup = () => {
  const [backupFile, setBackupFile] = useState(null);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const showResponseMessage = (response, isError = false) => {
    const message = response?.data?.message || response?.message || 'Operación completada';
    toast({
      title: isError ? 'Error' : 'Éxito',
      description: message,
      variant: isError ? 'destructive' : 'default'
    });
  };

  const handleBackupDownload = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/backup`, { 
        responseType: 'blob',
        timeout: 30000 // 30 segundos de timeout
      });
      
      // Verificar si la respuesta es un JSON de error
      const fileType = response.headers['content-type'];
      if (fileType === 'application/json') {
        const reader = new FileReader();
        reader.onload = () => {
          const errorResponse = JSON.parse(reader.result);
          showResponseMessage(errorResponse, true);
        };
        reader.readAsText(response.data);
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showResponseMessage({ message: 'Backup descargado con éxito' });
    } catch (error) {
      showResponseMessage(error.response || error, true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (!backupFile) {
      showResponseMessage({ message: 'Selecciona un archivo para restaurar' }, true);
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('backup', backupFile);
    formData.append('password', password);

    try {
      const response = await axios.post(`${API_URL}/api/restore`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000 // 30 segundos de timeout
      });
      showResponseMessage(response);
      // Limpiar el formulario después de una restauración exitosa
      setBackupFile(null);
      setPassword('');
      // Resetear el input de archivo
      const fileInput = document.getElementById('file');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      showResponseMessage(error.response || error, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Toaster />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Respaldo y Restauración</CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleBackupDownload} 
            className="w-full mb-4"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              'Descargar Backup'
            )}
          </Button>
          
          <form onSubmit={handleRestoreSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="file">Archivo de respaldo</Label>
                <Input
                  type="file"
                  id="file"
                  onChange={(e) => setBackupFile(e.target.files[0])}
                  accept=".zip"
                  disabled={isLoading}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Restaurando...
                  </>
                ) : (
                  'Restaurar'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Backup