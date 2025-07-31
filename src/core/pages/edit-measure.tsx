
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ResourceForm } from '../helpers/ResourceForm';
import { useForm } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Plus, 
  Trash2, 
  DoorOpen, 
  Ruler, 
  Package, 
  Crown, 
  Save,
  Edit3,
  User,
  Building2
} from 'lucide-react';
import api from '../api/api';

// Static options for selects (translated)
const openingSideOptions = [
  { value: 'onga', label: '' },
  { value: 'shepke', label: '' },
];
const swingDirectionOptions = [
  { value: 'syrtka', label: '' },
  { value: 'ishke', label: '' },
];
const constructionSideOptions = [
  { value: 'syrtka', label: '' },
  { value: 'ishke', label: '' },
];
const promogOptions = [
  { value: 'bar', label: '' },
  { value: 'jok', label: '' },
];
const casingZamerOptions = [
  { value: 'p', label: '' },
  { value: 'g', label: '' },
];
const zamerStatusOptions = [
  { value: 'new', label: '' },
  { value: 'completed', label: '' },
  { value: 'cancelled', label: '' },
];

// Dynamic options from API
type Option = { value: string | number; label: string };


interface Extension {
  width: string;
  height: string;
  quantity: string;
}

interface Crown {
  quantity: string;
}

interface Door {
  room_name: string;
  glass_type: string;
  width: string;
  height: string;
  quantity: string;
  opening_side: string;
  swing_direction: string;
  construction_side: string;
  promog: string;
  threshold: string;
  casing_zamer: string;
  extensions: Extension[];
  crowns: Crown[];
}

const defaultDoor: Door = {
  room_name: '',
  glass_type: '',
  width: '',
  height: '',
  quantity: '',
  opening_side: '',
  swing_direction: '',
  construction_side: '',
  promog: '',
  threshold: '',
  casing_zamer: '',
  extensions: [],
  crowns: [],
};


export default function EditMeasure() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Fill translated labels for static options
  openingSideOptions[0].label = t('forms.opening_side_onga');
  openingSideOptions[1].label = t('forms.opening_side_shepke');
  swingDirectionOptions[0].label = t('forms.swing_direction_sirtka');
  swingDirectionOptions[1].label = t('forms.swing_direction_ishke');
  constructionSideOptions[0].label = t('forms.construction_side_sirtka');
  constructionSideOptions[1].label = t('forms.construction_side_ishke');
  promogOptions[0].label = t('forms.promog_bar');
  promogOptions[1].label = t('forms.promog_joq');
  casingZamerOptions[0].label = t('forms.casing_zamer_p');
  casingZamerOptions[1].label = t('forms.casing_zamer_g');
  zamerStatusOptions[0].label = t('status.new');
  zamerStatusOptions[1].label = t('status.completed');
  zamerStatusOptions[2].label = t('status.cancelled');
  const [glassTypeOptions, setGlassTypeOptions] = useState<Option[]>([]);
  const [thresholdOptions, setThresholdOptions] = useState<Option[]>([]);
  // Fetch glass types and thresholds for selects
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [glassRes, thresholdRes] = await Promise.all([
          api.get('glass-types/'),
          api.get('thresholds/'),
        ]);
        setGlassTypeOptions(
          (glassRes.data || []).map((g: any) => ({ value: g.id, label: g.name }))
        );
        setThresholdOptions(
          (thresholdRes.data || []).map((t: any) => ({ value: t.id, label: t.name }))
        );
      } catch (e) {
        // Optionally handle error
      }
    }
    fetchOptions();
  }, []);
  const { id } = useParams<{ id: string }>();
  const [doors, setDoors] = useState<Door[]>([ { ...defaultDoor } ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For nested extensions/crowns per door
  const handleDoorChange = (idx: number, field: keyof Door, value: string) => {
    setDoors(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };
  const handleAddDoor = () => setDoors(prev => [ ...prev, { ...defaultDoor } ]);
  const handleRemoveDoor = (idx: number) => setDoors(prev => prev.filter((_, i) => i !== idx));

  const handleAddExtension = (doorIdx: number) => {
    setDoors(prev => prev.map((d, i) => i === doorIdx ? { ...d, extensions: [ ...(d.extensions || []), { width: '', height: '', quantity: '' } ] } : d));
  };
  const handleRemoveExtension = (doorIdx: number, extIdx: number) => {
    setDoors(prev => prev.map((d, i) => i === doorIdx ? { ...d, extensions: d.extensions.filter((_, j) => j !== extIdx) } : d));
  };
  const handleExtensionChange = (doorIdx: number, extIdx: number, field: keyof Extension, value: string) => {
    setDoors(prev => prev.map((d, i) => i === doorIdx ? {
      ...d,
      extensions: d.extensions.map((ext, j) => j === extIdx ? { ...ext, [field]: value } : ext)
    } : d));
  };

  const handleAddCrown = (doorIdx: number) => {
    setDoors(prev => prev.map((d, i) => i === doorIdx ? { ...d, crowns: [ ...(d.crowns || []), { quantity: '' } ] } : d));
  };
  const handleRemoveCrown = (doorIdx: number, crownIdx: number) => {
    setDoors(prev => prev.map((d, i) => i === doorIdx ? { ...d, crowns: d.crowns.filter((_, j) => j !== crownIdx) } : d));
  };
  const handleCrownChange = (doorIdx: number, crownIdx: number, value: string) => {
    setDoors(prev => prev.map((d, i) => i === doorIdx ? {
      ...d,
      crowns: d.crowns.map((c, j) => j === crownIdx ? { quantity: value } : c)
    } : d));
  };

  // Top-level form
  const form = useForm({
    defaultValues: {
      client_name: '',
      client_phone: '',
      address: '',
      zamer_status: '',
      comment: '',
    },
  });

  // Fetch measure data on mount and populate form and doors
  useEffect(() => {
    async function fetchMeasure() {
      if (!id) return;
      setIsSubmitting(true);
      try {
        const res = await api.get(`measures/${id}/`);
        const data = res.data;
        // Set form values
        form.reset({
          client_name: data.client_name || '',
          client_phone: data.client_phone || '',
          address: data.address || '',
          zamer_status: data.zamer_status || '',
          comment: data.comment || '',
        });
        // Set doors
        setDoors(
          Array.isArray(data.doors) && data.doors.length > 0
            ? data.doors.map((door: any) => ({
                room_name: door.room_name || '',
                glass_type: door.glass_type?.toString() || '',
                width: door.width?.toString() || '',
                height: door.height?.toString() || '',
                quantity: door.quantity?.toString() || '',
                opening_side: door.opening_side || '',
                swing_direction: door.swing_direction || '',
                construction_side: door.construction_side || '',
                promog: door.promog || '',
                threshold: door.threshold?.toString() || '',
                casing_zamer: door.casing_zamer || '',
                extensions: Array.isArray(door.extensions)
                  ? door.extensions.map((ext: any) => ({
                      width: ext.width?.toString() || '',
                      height: ext.height?.toString() || '',
                      quantity: ext.quantity?.toString() || '',
                    }))
                  : [],
                crowns: Array.isArray(door.crowns)
                  ? door.crowns.map((crown: any) => ({
                      quantity: crown.quantity?.toString() || '',
                    }))
                  : [],
              }))
            : [ { ...defaultDoor } ]
        );
      } catch (e) {
        // Optionally handle error
      } finally {
        setIsSubmitting(false);
      }
    }
    fetchMeasure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        doors: doors.map(door => ({
          ...door,
          glass_type: door.glass_type ? Number(door.glass_type) : '',
          threshold: door.threshold ? Number(door.threshold) : '',
          width: door.width ? Number(door.width) : '',
          height: door.height ? Number(door.height) : '',
          quantity: door.quantity ? Number(door.quantity) : '',
          extensions: (door.extensions || []).map(ext => ({
            width: ext.width ? Number(ext.width) : '',
            height: ext.height ? Number(ext.height) : '',
            quantity: ext.quantity ? Number(ext.quantity) : '',
          })),
          crowns: (door.crowns || []).map(crown => ({
            quantity: crown.quantity ? Number(crown.quantity) : '',
          })),
        })),
      };
      await api.put(`measures/${id}/`, payload);
      navigate('/measures')
    } catch (e) {
      alert('Error updating measure');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ResourceForm fields for top-level
  const fields = [
    { name: 'client_name', label: t('forms.client_name'), type: 'text', required: true },
    { name: 'client_phone', label: t('forms.client_phone'), type: 'text', required: true },
    { name: 'address', label: t('forms.address'), type: 'text', required: true },
    { name: 'zamer_status', label: t('forms.status'), type: 'select', options: zamerStatusOptions, required: true },
    { name: 'comment', label: t('forms.comment'), type: 'textarea' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Edit3 className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">{t('titles.edit_measure')}</h1>
        </div>
      </div>

      <div className="space-y-8">
        {/* Client Information Card - Full Width */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-blue-600" />
              {t('forms.client_information')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceForm
              fields={fields}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              form={form}
              hideSubmitButton={true}
            />
          </CardContent>
        </Card>

        {/* Doors Section */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-xl">
              <DoorOpen className="h-5 w-5 text-green-600" />
              {t('titles.doors')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {doors.map((door, idx) => (
              <Card key={idx} className="border-2 border-gray-100 hover:border-blue-200 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-semibold text-blue-600">{idx + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{t('forms.door')} #{idx + 1}</h3>
                        <p className="text-sm text-gray-500">{t('forms.door_details')}</p>
                      </div>
                    </div>
                    {doors.length > 1 && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleRemoveDoor(idx)}
                        className="hover:bg-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t('common.delete')}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Door Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {t('forms.room_name')}
                      </label>
                      <Input 
                        placeholder={t('forms.room_name')} 
                        value={door.room_name} 
                        onChange={e => handleDoorChange(idx, 'room_name', e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('forms.glass_type')}</label>
                      <Select value={door.glass_type?.toString() || ''} onValueChange={v => handleDoorChange(idx, 'glass_type', v)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder={t('forms.glass_type')} />
                        </SelectTrigger>
                        <SelectContent>
                          {glassTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Ruler className="h-4 w-4" />
                        {t('forms.width')}
                      </label>
                      <Input 
                        placeholder={t('forms.width')} 
                        type="number" 
                        value={door.width} 
                        onChange={e => handleDoorChange(idx, 'width', e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Ruler className="h-4 w-4" />
                        {t('forms.height')}
                      </label>
                      <Input 
                        placeholder={t('forms.height')} 
                        type="number" 
                        value={door.height} 
                        onChange={e => handleDoorChange(idx, 'height', e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {t('forms.quantity')}
                      </label>
                      <Input 
                        placeholder={t('forms.quantity')} 
                        type="number" 
                        value={door.quantity} 
                        onChange={e => handleDoorChange(idx, 'quantity', e.target.value)}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('forms.opening_side')}</label>
                      <Select value={door.opening_side} onValueChange={v => handleDoorChange(idx, 'opening_side', v)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder={t('forms.opening_side')} />
                        </SelectTrigger>
                        <SelectContent>
                          {openingSideOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('forms.swing_direction')}</label>
                      <Select value={door.swing_direction} onValueChange={v => handleDoorChange(idx, 'swing_direction', v)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder={t('forms.swing_direction')} />
                        </SelectTrigger>
                        <SelectContent>
                          {swingDirectionOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('forms.construction_side')}</label>
                      <Select value={door.construction_side} onValueChange={v => handleDoorChange(idx, 'construction_side', v)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder={t('forms.construction_side')} />
                        </SelectTrigger>
                        <SelectContent>
                          {constructionSideOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('forms.promog')}</label>
                      <Select value={door.promog} onValueChange={v => handleDoorChange(idx, 'promog', v)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder={t('forms.promog')} />
                        </SelectTrigger>
                        <SelectContent>
                          {promogOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('forms.threshold')}</label>
                      <Select value={door.threshold?.toString() || ''} onValueChange={v => handleDoorChange(idx, 'threshold', v)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder={t('forms.threshold')} />
                        </SelectTrigger>
                        <SelectContent>
                          {thresholdOptions.map(opt => <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">{t('forms.casing_zamer')}</label>
                      <Select value={door.casing_zamer} onValueChange={v => handleDoorChange(idx, 'casing_zamer', v)}>
                        <SelectTrigger className="border-gray-300 focus:border-blue-500">
                          <SelectValue placeholder={t('forms.casing_zamer')} />
                        </SelectTrigger>
                        <SelectContent>
                          {casingZamerOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Extensions Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-orange-600" />
                        <h4 className="font-semibold text-lg">{t('forms.extensions')}</h4>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddExtension(idx)}
                        className="border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('actions.add_extension')}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(door.extensions || []).map((ext, extIdx) => (
                        <div key={extIdx} className="flex gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <Input 
                            placeholder={t('forms.width')} 
                            type="number" 
                            value={ext.width} 
                            onChange={e => handleExtensionChange(idx, extIdx, 'width', e.target.value)}
                            className="flex-1 border-orange-300 focus:border-orange-500"
                          />
                          <Input 
                            placeholder={t('forms.height')} 
                            type="number" 
                            value={ext.height} 
                            onChange={e => handleExtensionChange(idx, extIdx, 'height', e.target.value)}
                            className="flex-1 border-orange-300 focus:border-orange-500"
                          />
                          <Input 
                            placeholder={t('forms.quantity')} 
                            type="number" 
                            value={ext.quantity} 
                            onChange={e => handleExtensionChange(idx, extIdx, 'quantity', e.target.value)}
                            className="flex-1 border-orange-300 focus:border-orange-500"
                          />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveExtension(idx, extIdx)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Crowns Section */}
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold text-lg">{t('forms.crowns')}</h4>
                      </div>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleAddCrown(idx)}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        {t('actions.add_crown')}
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {(door.crowns || []).map((crown, crownIdx) => (
                        <div key={crownIdx} className="flex gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <Input 
                            placeholder={t('forms.quantity')} 
                            type="number" 
                            value={crown.quantity} 
                            onChange={e => handleCrownChange(idx, crownIdx, e.target.value)}
                            className="flex-1 border-purple-300 focus:border-purple-500"
                          />
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveCrown(idx, crownIdx)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {/* Add Door Button at the bottom */}
            <div className="flex justify-center pt-4">
              <Button 
                type="button" 
                onClick={handleAddDoor}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3"
              >
                <Plus className="h-5 w-5 mr-2" />
                {t('actions.add_door')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="mt-8 flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          onClick={form.handleSubmit(onSubmit)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
        >
          <Save className="h-5 w-5 mr-2" />
          {isSubmitting ? t('actions.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
