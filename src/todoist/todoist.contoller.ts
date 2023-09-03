import { Controller, Post, Body, Get, UseGuards, Res, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { TodoistService } from './todoist.service';

@Controller('todo')
export class TodoistController {
  constructor(private readonly todoistService: TodoistService) {}

  @Get('todoist')
  @UseGuards(AuthGuard('todoist'))
  async loginWithTodoist() {
    // The user will be redirected to the Todoist login page
  }

  @Get('todoist/callback')
  @UseGuards(AuthGuard('todoist'))
  async todoistCallback(@Req() req: Request, @Res() res: Response) {
    // Handle the callback from Todoist and redirect to a success page
    return res.redirect('/todo/success');
  }

  @Get('success')
  async get() {
    return "success"
  }

  @Post('/sync')
  async handleTodoistWebhook(@Body() payload: any, @Res() res: Response) {
    // Handle the incoming webhook payload from Todoist
    const task = await this.todoistService.sync(payload)
   res.status(200).send(task)
  }
}