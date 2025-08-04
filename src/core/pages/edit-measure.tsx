
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { 
  Plus, 
  Trash2, 
  DoorOpen, 
  Crown, 
  Save,
  Edit3,
  User
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
      toast.success(t('messages.measure_updated_successfully'));
      navigate('/measures')
    } catch (e) {
      console.error('Error updating measure:', e);
      toast.error(t('messages.error_updating_measure'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium w-1/4">
                    <Label htmlFor="client_name">{t('forms.client_name')} *</Label>
                  </TableCell>
                  <TableCell>
                    <Input 
                      id="client_name"
                      {...form.register('client_name', { required: true })}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Label htmlFor="client_phone">{t('forms.client_phone')} *</Label>
                  </TableCell>
                  <TableCell>
                    <Input 
                      id="client_phone"
                      {...form.register('client_phone', { required: true })}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Label htmlFor="address">{t('forms.address')} *</Label>
                  </TableCell>
                  <TableCell>
                    <Input 
                      id="address"
                      {...form.register('address', { required: true })}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Label htmlFor="zamer_status">{t('forms.status')} *</Label>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={form.watch('zamer_status')} 
                      onValueChange={value => form.setValue('zamer_status', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
                        <SelectValue placeholder={t('forms.status')} />
                      </SelectTrigger>
                      <SelectContent>
                        {zamerStatusOptions.map(opt => 
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <Label htmlFor="comment">{t('forms.comment')}</Label>
                  </TableCell>
                  <TableCell>
                    <Textarea 
                      id="comment"
                      {...form.register('comment')}
                      className="border-gray-300 focus:border-blue-500"
                      rows={3}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Doors Section */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <DoorOpen className="h-5 w-5 text-green-600" />
                {t('titles.doors')}
              </CardTitle>
              <Button 
                type="button" 
                onClick={handleAddDoor}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.add_door')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {doors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>{t('forms.room_name')}</TableHead>
                    <TableHead>{t('forms.glass_type')}</TableHead>
                    <TableHead>{t('forms.width')}</TableHead>
                    <TableHead>{t('forms.height')}</TableHead>
                    <TableHead>{t('forms.quantity')}</TableHead>
                    <TableHead>{t('forms.opening_side')}</TableHead>
                    <TableHead>{t('forms.swing_direction')}</TableHead>
                    <TableHead>{t('forms.construction_side')}</TableHead>
                    <TableHead>{t('forms.promog')}</TableHead>
                    <TableHead>{t('forms.threshold')}</TableHead>
                    <TableHead>{t('forms.casing_zamer')}</TableHead>
                    <TableHead className="min-w-[250px]">{t('forms.extensions')}</TableHead>
                    <TableHead className="min-w-[200px]">{t('forms.crowns')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doors.map((door, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                          <span className="text-xs font-semibold text-blue-600">{idx + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder={t('forms.room_name')} 
                          value={door.room_name} 
                          onChange={e => handleDoorChange(idx, 'room_name', e.target.value)}
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={door.glass_type?.toString() || ''} onValueChange={v => handleDoorChange(idx, 'glass_type', v)}>
                          <SelectTrigger className="min-w-[120px]">
                            <SelectValue placeholder={t('forms.glass_type')} />
                          </SelectTrigger>
                          <SelectContent>
                            {glassTypeOptions.map(opt => 
                              <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="W" 
                          type="number" 
                          value={door.width} 
                          onChange={e => handleDoorChange(idx, 'width', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="H" 
                          type="number" 
                          value={door.height} 
                          onChange={e => handleDoorChange(idx, 'height', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Input 
                          placeholder="Qty" 
                          type="number" 
                          value={door.quantity} 
                          onChange={e => handleDoorChange(idx, 'quantity', e.target.value)}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={door.opening_side} onValueChange={v => handleDoorChange(idx, 'opening_side', v)}>
                          <SelectTrigger className="min-w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {openingSideOptions.map(opt => 
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={door.swing_direction} onValueChange={v => handleDoorChange(idx, 'swing_direction', v)}>
                          <SelectTrigger className="min-w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {swingDirectionOptions.map(opt => 
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={door.construction_side} onValueChange={v => handleDoorChange(idx, 'construction_side', v)}>
                          <SelectTrigger className="min-w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {constructionSideOptions.map(opt => 
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={door.promog} onValueChange={v => handleDoorChange(idx, 'promog', v)}>
                          <SelectTrigger className="min-w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {promogOptions.map(opt => 
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={door.threshold?.toString() || ''} onValueChange={v => handleDoorChange(idx, 'threshold', v)}>
                          <SelectTrigger className="min-w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {thresholdOptions.map(opt => 
                              <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={door.casing_zamer} onValueChange={v => handleDoorChange(idx, 'casing_zamer', v)}>
                          <SelectTrigger className="min-w-[80px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {casingZamerOptions.map(opt => 
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* Extensions Column */}
                      <TableCell className="min-w-[250px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-orange-600">{t('forms.extensions')}</span>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddExtension(idx)}
                              className="h-7 w-7 p-0 border-orange-300 text-orange-600 hover:bg-orange-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {door.extensions && door.extensions.length > 0 ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-3 gap-1 text-xs font-medium text-gray-600 mb-1">
                                <span className="text-center">{t('forms.width')}</span>
                                <span className="text-center">{t('forms.height')}</span>
                                <span className="text-center">{t('forms.quantity')}</span>
                              </div>
                              {door.extensions.map((ext, extIdx) => (
                                <div key={extIdx} className="flex gap-2 items-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                                  <Input 
                                    placeholder="W" 
                                    type="number" 
                                    value={ext.width} 
                                    onChange={e => handleExtensionChange(idx, extIdx, 'width', e.target.value)}
                                    className="h-8 w-16 text-sm text-center"
                                  />
                                  <Input 
                                    placeholder="H" 
                                    type="number" 
                                    value={ext.height} 
                                    onChange={e => handleExtensionChange(idx, extIdx, 'height', e.target.value)}
                                    className="h-8 w-16 text-sm text-center"
                                  />
                                  <Input 
                                    placeholder="Q" 
                                    type="number" 
                                    value={ext.quantity} 
                                    onChange={e => handleExtensionChange(idx, extIdx, 'quantity', e.target.value)}
                                    className="h-8 w-16 text-sm text-center"
                                  />
                                  <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleRemoveExtension(idx, extIdx)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                              {t('forms.no_extensions_added')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {/* Crowns Column */}
                      <TableCell className="min-w-[200px]">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-purple-600">{t('forms.crowns')}</span>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAddCrown(idx)}
                              className="h-7 w-7 p-0 border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          {door.crowns && door.crowns.length > 0 ? (
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-600 text-center mb-1">
                                {t('forms.quantity')}
                              </div>
                              {door.crowns.map((crown, crownIdx) => (
                                <div key={crownIdx} className="flex gap-2 items-center p-2 bg-purple-50 rounded-lg border border-purple-200">
                                  <Input 
                                    placeholder="Qty" 
                                    type="number" 
                                    value={crown.quantity} 
                                    onChange={e => handleCrownChange(idx, crownIdx, e.target.value)}
                                    className="h-8 flex-1 text-sm text-center"
                                  />
                                  <Button 
                                    type="button" 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => handleRemoveCrown(idx, crownIdx)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400 text-center py-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                              {t('forms.no_crowns_added')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doors.length > 1 && (
                          <Button 
                            type="button" 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveDoor(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                {t('common.no_data_available')}
              </div>
            )}
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
