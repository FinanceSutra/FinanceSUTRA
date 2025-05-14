import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Save, Plus, Trash2, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

const OptionWizard: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();

  // Strategy info state
  const [strategyName, setStrategyName] = useState('Short Straddle');
  const [underlying, setUnderlying] = useState('NIFTY BANK');
  const [capital, setCapital] = useState('100000');
  const [tradeType, setTradeType] = useState('Intraday');
  
  // Position state
  const [positions, setPositions] = useState([
    { 
      id: 1, 
      segment: 'CE', 
      buyOrSell: 'S', 
      strikeType: 'ATM Spot',
      strikeValue: 'ATM',
      expiry: 'Current Week',
      lots: 1,
      entryPercent: 1,
      slPercent: 40,
      trlPercent: 40
    },
    { 
      id: 2, 
      segment: 'PE', 
      buyOrSell: 'S', 
      strikeType: 'ATM Spot',
      strikeValue: 'ATM',
      expiry: 'Current Week',
      lots: 1,
      entryPercent: 1,
      slPercent: 40,
      trlPercent: 40
    }
  ]);

  // Entry settings state
  const [entryHour, setEntryHour] = useState('09');
  const [entryMinute, setEntryMinute] = useState('20');
  const [entryDays, setEntryDays] = useState(['Wed', 'Thu', 'Fri']);

  // Exit settings state
  const [profitTarget, setProfitTarget] = useState('None');
  const [stopLoss, setStopLoss] = useState('None');
  const [trailingStop, setTrailingStop] = useState('None');
  const [activateAt, setActivateAt] = useState('0');
  const [lockProfitAt, setLockProfitAt] = useState('0');
  const [profitIncrease, setProfitIncrease] = useState('0');
  const [tslIncrease, setTslIncrease] = useState('0');
  const [exitHour, setExitHour] = useState('15');
  const [exitMinute, setExitMinute] = useState('10');
  const [exitOnExpiry, setExitOnExpiry] = useState('Yes');
  const [exitAfterDays, setExitAfterDays] = useState('None');

  // Chart data
  const payoffLabels = Array.from({ length: 61 }, (_, i) => (47000 + i * 100).toString());
  const payoffData = Array.from({ length: 61 }, (_, i) => {
    // Simulate payoff calculation - this is where actual strategy calculation would happen
    const spot = 47000 + i * 100;
    const center = 50000;
    const distance = Math.abs(spot - center);
    // Bell curve-like payoff for straddle
    return Math.min(Math.max(-27000 + (1 - Math.pow(distance/3000, 2)) * 30000, -30000), 2500);
  });

  // Handle position changes
  const addPosition = () => {
    const newId = positions.length > 0 ? Math.max(...positions.map(p => p.id)) + 1 : 1;
    setPositions([
      ...positions, 
      { 
        id: newId, 
        segment: 'CE', 
        buyOrSell: 'S', 
        strikeType: 'ATM Spot',
        strikeValue: 'ATM',
        expiry: 'Current Week',
        lots: 1,
        entryPercent: 1,
        slPercent: 40,
        trlPercent: 40
      }
    ]);
  };

  const removePosition = (id: number) => {
    if (positions.length <= 1) {
      toast({
        title: "Cannot remove position",
        description: "At least one position is required",
        variant: "destructive"
      });
      return;
    }
    setPositions(positions.filter(p => p.id !== id));
  };

  const updatePosition = (id: number, field: string, value: string | number) => {
    setPositions(positions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Handle strategy saving
  const saveStrategyMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/strategies', data);
    },
    onSuccess: () => {
      toast({
        title: 'Strategy saved',
        description: 'Your option strategy has been saved successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/strategies'] });
      setLocation('/strategies');
    },
    onError: (error) => {
      toast({
        title: "Error saving strategy",
        description: `Failed to save: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveStrategy = () => {
    // Create code representation of the strategy
    const codeRepresentation = `
class OptionWizardStrategy:
    def __init__(self):
        self.name = "${strategyName}"
        self.underlying = "${underlying}"
        self.capital = ${capital}
        self.trade_type = "${tradeType}"
        
        # Positions
        self.positions = ${JSON.stringify(positions, null, 4)}
        
        # Entry settings
        self.entry_time = "${entryHour}:${entryMinute}"
        self.entry_days = ${JSON.stringify(entryDays)}
        
        # Exit settings
        self.profit_target = "${profitTarget}"
        self.stop_loss = "${stopLoss}"
        self.trailing_stop = "${trailingStop}"
        self.activate_at = ${activateAt || 0}
        self.lock_profit_at = ${lockProfitAt || 0}
        self.profit_increase = ${profitIncrease || 0}
        self.tsl_increase = ${tslIncrease || 0}
        self.exit_time = "${exitHour}:${exitMinute}"
        self.exit_on_expiry = ${exitOnExpiry === 'Yes'}
        self.exit_after_days = "${exitAfterDays}"
        
    def generate_signals(self, data):
        """Generate entry and exit signals for options strategy."""
        # Implementation of option strategy logic would go here
        
        return data
        
    def execute_strategy(self):
        """Execute the options strategy in live market."""
        # Implementation of execution logic would go here
        pass
`;

    // Prepare the strategy data to be saved
    const strategyData = {
      name: strategyName,
      description: `Option strategy for ${underlying} with positions: ${positions.map(p => 
        `${p.buyOrSell} ${p.strikeType} ${p.segment}`).join(', ')}. Entry at ${entryHour}:${entryMinute}, Exit at ${exitHour}:${exitMinute}.`,
      symbol: underlying === 'NIFTY BANK' ? 'INDEX:BANKNIFTY' : 'INDEX:NIFTY',
      timeframe: '5m',
      isActive: false,
      code: codeRepresentation,
    };

    saveStrategyMutation.mutate(strategyData);
  };

  // Generate time options for dropdowns
  const generateTimeOptions = (start: number, end: number, format: (n: number) => string) => {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(format);
  };

  const hours = generateTimeOptions(9, 15, (n) => n.toString().padStart(2, '0'));
  const minutes = generateTimeOptions(0, 59, (n) => n.toString().padStart(2, '0'));

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 mt-14 lg:mt-0 mb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/create-strategy')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="ml-4">
            <h1 className="text-2xl font-semibold text-neutral-900">
              Option Wizard
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Create option trading strategies with visual payoff diagrams
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={handleSaveStrategy} 
            disabled={saveStrategyMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Strategy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="create">
        <TabsList className="w-full md:w-auto mb-6">
          <TabsTrigger value="templates">Pre Built Strategies</TabsTrigger>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="my-strategies">My Strategies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Short Straddle</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Sell ATM call and put options to profit from low volatility and sideways movement.
                </p>
                <Button size="sm" onClick={() => setLocation('/option-wizard')}>
                  Select
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Iron Condor</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Limited risk, limited reward strategy for neutral market outlook.
                </p>
                <Button size="sm" onClick={() => setLocation('/option-wizard')}>
                  Select
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Bull Call Spread</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Buy lower strike call, sell higher strike call for bullish outlook.
                </p>
                <Button size="sm" onClick={() => setLocation('/option-wizard')}>
                  Select
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="create">
          <div className="grid grid-cols-1 gap-6">
            {/* Strategy Info */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="strategy-name">Strategy Name</Label>
                    <Input 
                      id="strategy-name" 
                      value={strategyName} 
                      onChange={(e) => setStrategyName(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="underlying">Underlying</Label>
                    <Select value={underlying} onValueChange={setUnderlying}>
                      <SelectTrigger id="underlying">
                        <SelectValue placeholder="Select underlying" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIFTY BANK">NIFTY BANK</SelectItem>
                        <SelectItem value="NIFTY">NIFTY</SelectItem>
                        <SelectItem value="FINNIFTY">FINNIFTY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capital">Capital</Label>
                    <Input 
                      id="capital" 
                      type="number" 
                      value={capital} 
                      onChange={(e) => setCapital(e.target.value)} 
                    />
                  </div>
                  <div>
                    <Label htmlFor="trade-type">Type</Label>
                    <Select value={tradeType} onValueChange={setTradeType}>
                      <SelectTrigger id="trade-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Intraday">Intraday</SelectItem>
                        <SelectItem value="Positional">Positional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Positions */}
            <Card>
              <CardHeader>
                <CardTitle>Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-8 gap-2">
                    <Label className="col-span-1">Segment</Label>
                    <Label className="col-span-1">B/S</Label>
                    <Label className="col-span-2">Strike Selection</Label>
                    <Label className="col-span-1">Value</Label>
                    <Label className="col-span-1">Expiry</Label>
                    <Label className="col-span-1">Lots(1 lot=30)</Label>
                    <Label className="col-span-1"></Label>
                  </div>

                  {/* Position inputs */}
                  <div className="space-y-2">
                    {positions.map((position) => (
                      <div key={position.id} className="grid grid-cols-8 gap-2 items-center">
                        <div className="col-span-1">
                          <Select 
                            value={position.segment} 
                            onValueChange={(val) => updatePosition(position.id, 'segment', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CE">CE</SelectItem>
                              <SelectItem value="PE">PE</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1">
                          <Select 
                            value={position.buyOrSell} 
                            onValueChange={(val) => updatePosition(position.id, 'buyOrSell', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="B">B</SelectItem>
                              <SelectItem value="S">S</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-2">
                          <Select 
                            value={position.strikeType} 
                            onValueChange={(val) => updatePosition(position.id, 'strikeType', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ATM Spot">ATM Spot</SelectItem>
                              <SelectItem value="ITM">ITM</SelectItem>
                              <SelectItem value="OTM">OTM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1">
                          <Select 
                            value={position.strikeValue} 
                            onValueChange={(val) => updatePosition(position.id, 'strikeValue', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ATM">ATM</SelectItem>
                              <SelectItem value="+1">+1</SelectItem>
                              <SelectItem value="-1">-1</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1">
                          <Select 
                            value={position.expiry} 
                            onValueChange={(val) => updatePosition(position.id, 'expiry', val)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Current Week">Current Week</SelectItem>
                              <SelectItem value="Next Week">Next Week</SelectItem>
                              <SelectItem value="Monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-1">
                          <Select 
                            value={position.lots.toString()} 
                            onValueChange={(val) => updatePosition(position.id, 'lots', parseInt(val))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => removePosition(position.id)}
                          className="col-span-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-10 gap-2 mt-4">
                    <div className="col-span-2 md:col-span-1">
                      <Label>Strike Selection</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>Value</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>Expiry</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>Segment</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>Lots</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>TGT</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>SL %</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>TRL %</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <Label>Entry %</Label>
                    </div>
                    <div className="col-span-2 md:col-span-1"></div>
                  </div>

                  {/* Position details */}
                  {positions.map((position) => (
                    <div key={`detail-${position.id}`} className="grid grid-cols-2 md:grid-cols-10 gap-2 items-center">
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          readOnly 
                          value={position.strikeType} 
                          className="bg-muted" 
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          readOnly 
                          value={position.strikeValue} 
                          className="bg-muted" 
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          readOnly 
                          value={position.expiry} 
                          className="bg-muted" 
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          readOnly 
                          value={position.segment} 
                          className="bg-muted" 
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          value={position.lots.toString()}
                          onChange={(e) => updatePosition(position.id, 'lots', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          value="90"
                          readOnly
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          value={position.slPercent.toString()}
                          onChange={(e) => updatePosition(position.id, 'slPercent', parseInt(e.target.value) || 40)}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          value={position.trlPercent.toString()}
                          onChange={(e) => updatePosition(position.id, 'trlPercent', parseInt(e.target.value) || 40)}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Input 
                          value={position.entryPercent.toString()}
                          onChange={(e) => updatePosition(position.id, 'entryPercent', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removePosition(position.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button onClick={addPosition} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Position
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Entry Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Entry Setting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Entry Time (hh:mm)</Label>
                      <div className="flex space-x-2">
                        <Select value={entryHour} onValueChange={setEntryHour}>
                          <SelectTrigger>
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map(hour => (
                              <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={entryMinute} onValueChange={setEntryMinute}>
                          <SelectTrigger>
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map(minute => (
                              <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Enter on Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                          <div 
                            key={day}
                            className={`flex items-center px-3 py-1 rounded-md cursor-pointer border ${
                              entryDays.includes(day) 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-background text-foreground'
                            }`}
                            onClick={() => {
                              if (entryDays.includes(day)) {
                                setEntryDays(entryDays.filter(d => d !== day));
                              } else {
                                setEntryDays([...entryDays, day]);
                              }
                            }}
                          >
                            {day}
                            {entryDays.includes(day) && (
                              <span className="ml-2">×</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Exit Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Exit Setting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Profit MTM</Label>
                        <Select value={profitTarget} onValueChange={setProfitTarget}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Fixed">Fixed</SelectItem>
                            <SelectItem value="Percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Input value="0" readOnly className="bg-muted" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Stoploss MTM</Label>
                        <Select value={stopLoss} onValueChange={setStopLoss}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Fixed">Fixed</SelectItem>
                            <SelectItem value="Percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>&nbsp;</Label>
                        <Input value="0" readOnly className="bg-muted" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Trailing Stoploss</Label>
                        <Select value={trailingStop} onValueChange={setTrailingStop}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="Fixed">Fixed</SelectItem>
                            <SelectItem value="Percentage">Percentage</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Activate At</Label>
                        <Input 
                          value={activateAt} 
                          onChange={(e) => setActivateAt(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Lock Profit At</Label>
                        <Input 
                          value={lockProfitAt} 
                          onChange={(e) => setLockProfitAt(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>When Profit increase by</Label>
                        <Input 
                          value={profitIncrease} 
                          onChange={(e) => setProfitIncrease(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Increase TSL by</Label>
                      <Input 
                        value={tslIncrease} 
                        onChange={(e) => setTslIncrease(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Exit Time (hh:mm)</Label>
                      <div className="flex space-x-2">
                        <Select value={exitHour} onValueChange={setExitHour}>
                          <SelectTrigger>
                            <SelectValue placeholder="Hour" />
                          </SelectTrigger>
                          <SelectContent>
                            {hours.map(hour => (
                              <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={exitMinute} onValueChange={setExitMinute}>
                          <SelectTrigger>
                            <SelectValue placeholder="Minute" />
                          </SelectTrigger>
                          <SelectContent>
                            {minutes.map(minute => (
                              <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Label>Exit On Expiry</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Exit all positions on expiry day</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select value={exitOnExpiry} onValueChange={setExitOnExpiry}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Exit after Entry + x days</Label>
                        <Select value={exitAfterDays} onValueChange={setExitAfterDays}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                              <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payoff Diagram */}
            <Card>
              <CardHeader>
                <CardTitle>Pay Off</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-96 relative">
                  {/* This is where a chart component would normally go */}
                  {/* Simulated chart for demonstration purposes */}
                  <div className="w-full h-full flex flex-col">
                    <div className="text-right text-sm text-muted-foreground">
                      Profit/Loss
                    </div>
                    <div className="flex-1 relative">
                      {/* X and Y axis */}
                      <div className="absolute left-0 top-0 w-full h-full bg-muted/10 rounded-md">
                        {/* Center horizontal line */}
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-muted-foreground/50"></div>
                        
                        {/* Vertical lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                          <div key={ratio} className="absolute top-0 bottom-0 w-px bg-muted-foreground/20"
                              style={{ left: `${ratio * 100}%` }}></div>
                        ))}
                        
                        {/* Data visualization - approximation of the curve in the screenshot */}
                        <svg className="w-full h-full" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.2)" />
                              <stop offset="100%" stopColor="rgba(59, 130, 246, 0)" />
                            </linearGradient>
                          </defs>
                          
                          {/* Draw the profit/loss curve */}
                          <path 
                            d={`M 0 ${95} ${payoffData.map((val, i) => {
                              // Scale x to full width and y to center and scale
                              const x = (i / (payoffData.length - 1)) * 100;
                              // Transform from actual P&L values to percentage of chart height (0-100)
                              // Higher values = lower position on chart (SVG coords)
                              const normalizedValue = (val + 30000) / 60000; // Normalize to 0-1 range
                              const y = 100 - (normalizedValue * 100); // Invert for SVG coords
                              return `L ${x} ${y}`;
                            }).join(' ')}`}
                            fill="none"
                            stroke="rgb(59, 130, 246)"
                            strokeWidth="2"
                          />
                          
                          {/* Fill area below curve with gradient */}
                          <path 
                            d={`M 0 ${95} ${payoffData.map((val, i) => {
                              const x = (i / (payoffData.length - 1)) * 100;
                              const normalizedValue = (val + 30000) / 60000;
                              const y = 100 - (normalizedValue * 100);
                              return `L ${x} ${y}`;
                            }).join(' ')} L 100 95 Z`}
                            fill="url(#areaGradient)"
                            opacity="0.7"
                          />
                          
                          {/* Add red regions for negative P&L */}
                          <path 
                            d={`M 0 50 ${payoffData.map((val, i) => {
                              const x = (i / (payoffData.length - 1)) * 100;
                              const normalizedValue = (val + 30000) / 60000;
                              const y = 100 - (normalizedValue * 100);
                              return `L ${x} ${Math.max(y, 50)}`; // Only show negative areas
                            }).join(' ')} L 100 50 Z`}
                            fill="rgba(239, 68, 68, 0.2)" 
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                      <span>47,000</span>
                      <span>50,000</span>
                      <span>53,000</span>
                    </div>
                    <div className="flex justify-center text-sm text-muted-foreground">
                      <input
                        type="date"
                        defaultValue="2025-04-09"
                        className="border rounded px-2 py-1 mt-2 text-sm text-center"
                      />
                    </div>
                    <div className="mt-4">
                      <Slider defaultValue={[50]} max={100} step={1} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center mt-6">
              <Button size="lg" onClick={handleSaveStrategy}>
                <Save className="w-5 h-5 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="my-strategies">
          <div className="flex flex-col space-y-4">
            <Select defaultValue="default">
              <SelectTrigger className="w-full sm:w-[300px] mb-4">
                <SelectValue placeholder="Select Own Strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Select Own Strategy</SelectItem>
                <SelectItem value="short-straddle">Short Straddle</SelectItem>
                <SelectItem value="iron-condor">Iron Condor</SelectItem>
              </SelectContent>
            </Select>
            
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  Select a strategy to view and edit
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OptionWizard;