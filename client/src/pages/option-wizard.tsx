import React, { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { 
  Clock, 
  TrashIcon,
  Save, 
  Plus, 
  Info,
  Trash2 
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import PayoffGraph from '@/components/option-wizard/PayoffGraph';

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
      slPercent: 40,
      trlPercent: 40,
      entryPercent: 1
    },
    { 
      id: 2, 
      segment: 'PE', 
      buyOrSell: 'S', 
      strikeType: 'ATM Spot', 
      strikeValue: 'ATM', 
      expiry: 'Current Week', 
      lots: 1,
      slPercent: 40,
      trlPercent: 40,
      entryPercent: 1
    }
  ]);

  // Entry settings
  const [entryHour, setEntryHour] = useState('09');
  const [entryMinute, setEntryMinute] = useState('20');
  const [entryDays, setEntryDays] = useState(['Wed', 'Thu', 'Fri']);

  // Exit settings
  const [exitHour, setExitHour] = useState('15');
  const [exitMinute, setExitMinute] = useState('10');
  const [profitTarget, setProfitTarget] = useState('None');
  const [stopLoss, setStopLoss] = useState('None');
  const [trailingStop, setTrailingStop] = useState('None');
  const [activateAt, setActivateAt] = useState('0');
  const [lockProfitAt, setLockProfitAt] = useState('0');
  const [profitIncrease, setProfitIncrease] = useState('0');
  const [tslIncrease, setTslIncrease] = useState('0');
  const [exitOnExpiry, setExitOnExpiry] = useState(true);
  const [exitAfterDays, setExitAfterDays] = useState('None');

  // Utils
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  
  // Helper to calculate days to expiry based on selection
  const calculateDaysToExpiry = useMemo(() => {
    if (tradeType === "Intraday") return 1;
    
    const expiryMap = {
      "Current Week": 5,
      "Next Week": 12,
      "Monthly": 30
    };
    
    // Get the maximum expiry from all positions
    return Math.max(
      ...positions.map(pos => expiryMap[pos.expiry as keyof typeof expiryMap] || 5)
    );
  }, [positions, tradeType]);

  const updatePosition = (id: number, field: string, value: string | number) => {
    setPositions(positions.map(pos => 
      pos.id === id ? { ...pos, [field]: value } : pos
    ));
  };

  const addPosition = () => {
    const newId = Math.max(...positions.map(p => p.id)) + 1;
    setPositions([...positions, { 
      id: newId, 
      segment: 'CE', 
      buyOrSell: 'B', 
      strikeType: 'ATM Spot', 
      strikeValue: 'ATM', 
      expiry: 'Current Week', 
      lots: 1,
      slPercent: 40,
      trlPercent: 40,
      entryPercent: 1
    }]);
  };

  const removePosition = (id: number) => {
    if (positions.length > 1) {
      setPositions(positions.filter(p => p.id !== id));
    } else {
      toast({
        title: "Cannot Remove",
        description: "At least one position is required",
        variant: "destructive",
      });
    }
  };

  const handleSaveStrategy = async () => {
    try {
      toast({
        title: "Strategy Saved",
        description: "Your strategy has been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save strategy. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-3xl font-bold mb-6">Option Strategy Wizard</h1>
      
      <Tabs defaultValue="builder">
        <TabsList className="mb-6">
          <TabsTrigger value="builder">Builder</TabsTrigger>
          <TabsTrigger value="my-strategies">My Strategies</TabsTrigger>
        </TabsList>
        
        <TabsContent value="builder">
          <div className="space-y-6">
            {/* Strategy Info */}
            <Card>
              <CardHeader>
                <CardTitle>Strategy Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <Label htmlFor="strategyName">Strategy</Label>
                    <Input 
                      id="strategyName"
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="underlying">Underlying</Label>
                    <Select value={underlying} onValueChange={setUnderlying}>
                      <SelectTrigger id="underlying" className="mt-1">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NIFTY BANK">NIFTY BANK</SelectItem>
                        <SelectItem value="NIFTY 50">NIFTY 50</SelectItem>
                        <SelectItem value="NIFTY FIN SERVICE">NIFTY FIN SERVICE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="capital">Capital</Label>
                    <Input 
                      id="capital"
                      value={capital}
                      onChange={(e) => setCapital(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="tradeType">Type</Label>
                    <Select value={tradeType} onValueChange={setTradeType}>
                      <SelectTrigger id="tradeType" className="mt-1">
                        <SelectValue placeholder="Select" />
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
                <div className="space-y-6">
                  {/* Position header */}
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
                  
                  {/* Position details grid headers */}
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
                          <Button
                            key={day}
                            type="button"
                            variant={entryDays.includes(day) ? "default" : "outline"}
                            className={entryDays.includes(day) 
                              ? "bg-green-500 hover:bg-green-600 text-white" 
                              : "bg-red-100 text-red-800 hover:bg-red-200 border border-red-300"}
                            onClick={() => {
                              if (entryDays.includes(day)) {
                                setEntryDays(entryDays.filter(d => d !== day));
                              } else {
                                setEntryDays([...entryDays, day]);
                              }
                            }}
                          >
                            {day}
                          </Button>
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
                        <Select value={exitOnExpiry ? "Yes" : "No"} onValueChange={(val) => setExitOnExpiry(val === "Yes")}>
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
                        <div className="flex items-center space-x-2">
                          <Label>Exit after Entry + x days</Label>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Exit positions after specified days from entry</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <Select value={exitAfterDays} onValueChange={setExitAfterDays}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="None">None</SelectItem>
                            <SelectItem value="1">1 day</SelectItem>
                            <SelectItem value="2">2 days</SelectItem>
                            <SelectItem value="3">3 days</SelectItem>
                            <SelectItem value="4">4 days</SelectItem>
                            <SelectItem value="5">5 days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Trade execution date</Label>
                      <Input 
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

            {/* Payoff Graph */}
            <PayoffGraph 
              positions={positions}
              underlying={underlying}
              daysLeft={calculateDaysToExpiry}
              entryDays={entryDays}
            />

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